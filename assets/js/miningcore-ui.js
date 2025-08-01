var API = 'https://superblockchain.con-ip.com/miningcore/api/';
var URLSTRATUM = "superblockchain.con-ip.com";
var defaultPool = 'doge';
var ticketCoinPool = ' DOGE'; 
var currentPool = defaultPool;

function _formatter(value, decimal, unit) {
    if (value === 0) {
        return '0 ' + unit;
    } else {
        var si = [
            { value: 1, symbol: "" },
            { value: 1e3, symbol: "k" },
            { value: 1e6, symbol: "M" },
            { value: 1e9, symbol: "G" },
            { value: 1e12, symbol: "T" },
            { value: 1e15, symbol: "P" },
            { value: 1e18, symbol: "E" },
            { value: 1e21, symbol: "Z" },
            { value: 1e24, symbol: "Y" },
        ];
        for (var i = si.length - 1; i > 0; i--) {
            if (value >= si[i].value) {
                break;
            }
        }
        return (value / si[i].value).toFixed(decimal).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1") + ' ' + si[i].symbol + unit;
    }
}

function loadPools(renderCallback) {
    $('#currentPool b').remove();
    $('#currentPool ul').remove();
    return $.ajax(API + 'pools')
        .done(function (data) {
            var poolList = '<ul class="dropdown-menu">';
            if (data.pools.length > 1) {
                $('#currentPool').attr('data-toggle', 'dropdown');
                $('#currentPool').append('<b class="caret"></b>');
            }
            $.each(data.pools, function (index, value) {
                if (currentPool.length === 0 && index === 0) {
                    currentPool = value.id;
                }
                if (currentPool === value.id) {
                    $('#currentPool p').attr('data-id', value.id);
                    $('#currentPool p').text(value.coin.type);
                } else {
                    poolList += '<li><a href="javascript:void(0)" data-id="' + value.id + '">' + value.coin.type + '</a></li>';
                }
            });
            poolList += '</ul>';
            if (poolList.length > 0) {
                $('#poolList').append(poolList);
            }
            if (data.pools.length > 1) {
                $('#poolList li a').on('click', function (event) {
                    currentPool = $(event.target).attr('data-id');
                    loadPools(renderCallback);
                });
            }
            if (renderCallback.has()) {
                renderCallback.fire();
            }
        })
        .fail(function () {
            $.notify({
                icon: "ti-cloud-down",
                message: "Error: No response from API.<br>(loadPools)",
            }, {
                type: 'danger',
                timer: 3000,
            });
        });
}

function loadStatsData() {
    return $.ajax(API + 'pools')
        .done(function (data) {
            $.each(data.pools, function (index, value) {
                if (currentPool === value.id) {
                    percentagePoolHashRate = (value.poolStats.poolHashrate * 100 / value.networkStats.networkHashrate).toFixed(2); 
                    $('#poolMiners').text(_formatter(value.poolStats.connectedMiners, 0, ''));
                    $('#percentagePoolHashRate').text(percentagePoolHashRate + ' %');
                    $('#poolHashRate').text(_formatter(value.poolStats.poolHashrate, 5, 'H/s'));
                    $('#networkHashRate').text(_formatter(value.networkStats.networkHashrate, 5, 'H/s'));
                    $('#networkDifficulty').text(_formatter(value.networkStats.networkDifficulty, 5, ''));
                    $('#networkBlock').text(value.networkStats.blockHeight, 0, '');
                    $('#connectedPeers').text(value.networkStats.connectedPeers, 0, '');
                    const isoString = value.networkStats.lastNetworkBlockTime;
                    const date = new Date(isoString);
                    const yyyy = date.getFullYear();
                    const mm = String(date.getMonth() + 1).padStart(2, '0');
                    const dd = String(date.getDate()).padStart(2, '0');
                    const hh = String(date.getHours()).padStart(2, '0');
                    const mi = String(date.getMinutes()).padStart(2, '0');
                    const ss = String(date.getSeconds()).padStart(2, '0');
                    const lastNetworkBlockTime = `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
                    $('#lastNetworkBlockTime').text(lastNetworkBlockTime, 0, '');
                    $('#totalBlocks').text(value.totalBlocks, 0, '');
                    $('#totalPaid').text(value.totalPaid, 0, '');
                    $('#poolEffort').text(value.poolEffort + ' %');
                    $('#poolFeePercent').text(value.poolFeePercent + ' %');
                    $('#payoutScheme').text(value.paymentProcessing.payoutScheme, 0, '');
                    $('#minimumPayment').text(value.paymentProcessing.minimumPayment, 0, '');
                }
            });
        })
        .fail(function () {
            $.notify({
                icon: "ti-cloud-down",
                message: "Error: No response from API.<br>(loadStatsData)",
            }, {
                type: 'danger',
                timer: 3000,
            });
        });
}

function loadStatsChart() {
    return $.ajax(API + 'pools/' + currentPool + '/performance')
        .done(function (data) {
            labels = [];
            connectedMiners = [];
            poolHashRate = [];
            $.each(data.stats, function (index, value) {
                if (labels.length === 0 || (labels.length + 1) % 4 === 1) {
                    labels.push(new Date(value.created).toISOString().slice(11, 16));
                } else {
                    labels.push('');
                }
                poolHashRate.push(value.poolHashrate);
                connectedMiners.push(value.connectedMiners);
            });
            var data = {
                labels: labels,
                series: [
                    poolHashRate,
                ],
            };
            var options = {
                showArea: true,
                height: "245px",
                axisX: {
                    showGrid: false,
                },
                axisY: {
                    offset: 60,
                    labelInterpolationFnc: function(value) {
                        return _formatter(value, 1, '');
                    }
                },
                lineSmooth: Chartist.Interpolation.simple({
                    divisor: 2,
                }),
            };
            var responsiveOptions = [
                ['screen and (max-width: 640px)', {
                    axisX: {
                        labelInterpolationFnc: function (value) {
                            return value[0];
                        }
                    },
                }],
            ];
            Chartist.Line('#chartStatsHashRate', data, options, responsiveOptions);
            var data = {
                labels: labels,
                series: [
                    connectedMiners,
                ],
            };
            var options = {
                height: "245px",
                axisX: {
                    showGrid: false,
                },
                lineSmooth: Chartist.Interpolation.simple({
                    divisor: 2,
                }),
            };
            var responsiveOptions = [
                ['screen and (max-width: 640px)', {
                    axisX: {
                        labelInterpolationFnc: function (value) {
                            return value[0];
                        }
                    },
                }],
            ];
            Chartist.Line('#chartStatsMiners', data, options, responsiveOptions);
        })
        .fail(function () {
            $.notify({
                icon: "ti-cloud-down",
                message: "Error: No response from API.<br>(loadStatsChart)",
            }, {
                type: 'danger',
                timer: 3000,
            });
        });
}

function loadDashboardData(walletAddress) {
    var poolStatsRequest = $.ajax(API + 'pools'); // para obtener el poolHashrate
    var minerStatsRequest = $.ajax(API + 'pools/' + currentPool + '/miners/' + walletAddress);

    return $.when(poolStatsRequest, minerStatsRequest)
        .done(function(poolResponse, minerResponse) {
            var poolData = poolResponse[0];
            var minerData = minerResponse[0];

            // Obtener poolHashrate
            var poolHashrate = 0;
            $.each(poolData.pools, function(index, value) {
                if (currentPool === value.id) {
                    poolHashrate = value.poolStats.poolHashrate;
                }
            });

            // Calcular hashrate total del minero
            var minerHashrate = 0;
            if (minerData.performance) {
                $.each(minerData.performance.workers, function(index, value) {
                    minerHashrate += value.hashrate;
                });
            }

            var numWorkers = 0;
            if (minerData.performance && minerData.performance.workers) {
                var workers = minerData.performance.workers;
                numWorkers = Object.keys(workers).length;
            }

            // Mostrar datos
            $('#minerHashRate').text(_formatter(minerHashrate, 5, 'H/s'));
            $('#pendingShares').text(_formatter(minerData.pendingShares, 0, ''));
            $('#pendingBalance').text((minerData.pendingBalance).toFixed(4) + ticketCoinPool);
            $('#paidBalance').text((minerData.totalPaid).toFixed(4) + ticketCoinPool);
            $('#lifetimeBalance').text((minerData.pendingBalance + minerData.totalPaid).toFixed(4) + ticketCoinPool);
            $('#minerWorkerCount').text(numWorkers);

            // Calcular y mostrar % de contribución del minero
            if (poolHashrate > 0) {
                var minerContribution = (minerHashrate * 100 / poolHashrate).toFixed(2);
                $('#minerContribution').text(minerContribution + ' %');
            } else {
                $('#minerContribution').text('0 %');
            }
        })
        .fail(function() {
            $.notify({
                icon: "ti-cloud-down",
                message: "Error: No response from API.<br>(loadDashboardData + poolStats)",
            }, {
                type: 'danger',
                timer: 3000,
            });
        });
}

function loadDashboardWorkerList(walletAddress) {
    return $.ajax(API + "pools/" + currentPool + "/miners/" + walletAddress)
        .done(function (data) {
            var workerList = '<thead><th>Name</th><th>Hash Rate</th><th>Share Rate</th></thead><tbody>';
            if (data.performance) {
                var workerCount = 0;
                $.each(data.performance.workers, function(index, value) {
                    workerCount++;
                    workerList += '<tr>';
                    if (index.length === 0) {
                        workerList += '<td>Unnamed</td>';
                    } else {
                        workerList += '<td>' + index + '</td>';
                    }
                    workerList += '<td>' + _formatter(value.hashrate, 5, 'H/s') + '</td>';
                    workerList += '<td>' + _formatter(value.sharesPerSecond, 5, 'S/s') + '</td>';
                    workerList += '</tr>';
                });
            } else {
                workerList += '<tr><td colspan="3">None</td></tr>';
            }
            workerList += '</tbody>';
            $('#workerList').html(workerList);
        })
        .fail(function () {
            $.notify({
                icon: "ti-cloud-down",
                message: "Error: No response from API.<br>(loadDashboardWorkerList)",
            }, {
                type: 'danger',
                timer: 3000,
            });
        });
}

function loadDashboardChart(walletAddress) {
    return $.ajax(API + 'pools/' + currentPool + '/miners/' + walletAddress + '/performance')
        .done(function (data) {
            if (data.length > 0) {
                labels = [];
                minerHashRate = [];
                $.each(data, function (index, value) {
                    if (labels.length === 0 || (labels.length + 1) % 4 === 1) {
                        labels.push(new Date(value.created).toISOString().slice(11, 16));
                    } else {
                        labels.push('');
                    }
                    var workerHashRate = 0;
                    $.each(value.workers, function (index2, value2) {
                        workerHashRate += value2.hashrate;
                    });
                    minerHashRate.push(workerHashRate);
                });
                var data = {
                    labels: labels,
                    series: [
                        minerHashRate,
                    ],
                };
                var options = {
                    showArea: true,
                    height: "245px",
                    axisX: {
                        showGrid: false,
                    },
                    axisY: {
                        offset: 47,
                        labelInterpolationFnc: function(value) {
                            return _formatter(value, 1, '');
                        }
                    },
                    lineSmooth: Chartist.Interpolation.simple({
                        divisor: 2,
                    }),
                };
                var responsiveOptions = [
                    ['screen and (max-width: 640px)', {
                        axisX: {
                            labelInterpolationFnc: function (value) {
                                return value[0];
                            }
                        },
                    }],
                ];
                Chartist.Line('#chartDashboardHashRate', data, options, responsiveOptions);
            }
        })
        .fail(function () {
            $.notify({
                icon: "ti-cloud-down",
                message: "Error: No response from API.<br>(loadDashboardChart)",
            }, {
                type: 'danger',
                timer: 3000,
            });
        });
}

function loadMinersList() {
    return $.ajax(API + 'pools/' + currentPool + '/miners')
        .done(function (data) {
            var minerList = '<thead><tr><th>Address</th><th>Hash Rate</th><th>Share Rate</th></tr></thead><tbody>';
            if (data.length > 0) {
                $.each(data, function (index, value) {
                    minerList += '<tr>';
                    minerList += '<td>' + value.miner.substring(0, 12) + ' &hellip; ' + value.miner.substring(value.miner.length - 12) + '</td>';
                    minerList += '<td>' + _formatter(value.hashrate, 5, 'H/s') + '</td>';
                    minerList += '<td>' + _formatter(value.sharesPerSecond, 5, 'S/s') + '</td>';
                    minerList += '</tr>';
                });
            } else {
                minerList += '<tr><td colspan="3">None</td></tr>';
            }
            minerList += '</tbody>';
            $('#minerList').html(minerList);
        })
        .fail(function () {
            $.notify({
                icon: "ti-cloud-down",
                message: "Error: No response from API.<br>(loadMinersList)",
            }, {
                type: 'danger',
                timer: 3000,
            });
        });
}

function loadBlocksList() {
    return $.ajax(API + 'pools/' + currentPool + '/blocks?pageSize=100')
        .done(function (data) {
            var blockList = '<thead><tr><th colspan="2">Date &amp; Time</th><th>Height</th><th>Status</th><th>Reward</th><th>Confirmation</th><th>TxID</th></tr></thead><tbody>';
            if (data.length > 0) {
                $.each(data, function (index, value) {
                    blockList += '<tr>';
                    blockList += '<td colspan="2">' + new Date(value.created).toLocaleString() + '</td>';
                    blockList += '<td>' + value.blockHeight + '</td>';
                    blockList += '<td style="text-transform: capitalize">' + value.status + '</td>';
                    blockList += '<td>' + _formatter(value.reward, 5, '') + '</td>';
                    blockList += '<td>' + Math.round(value.confirmationProgress * 100) + '%</td>';
                    blockList += '<td colspan="3"><a href="' + value.infoLink + '" target="_blank">' + value.transactionConfirmationData.substring(0, 16) + ' &hellip; ' + value.transactionConfirmationData.substring(value.transactionConfirmationData.length - 16) + ' </a></td>';
                    blockList += '</tr>'
                });
            } else {
                blockList += '<tr><td colspan="5">None</td></tr>';
            }
            blockList += '</tbody>';
            $('#blockList').html(blockList);
        })
        .fail(function () {
            $.notify({
                icon: "ti-cloud-down",
                message: "Error: No response from API.<br>(loadBlocksList)",
            }, {
                type: 'danger',
                timer: 3000,
            });
        });
}

function loadPaymentsList() {
    return $.ajax(API + 'pools/' + currentPool + '/payments?pageSize=500')
        .done(function (data) {
            var paymentList = '<thead><tr><th colspan="2">Date &amp; Time</th><th colspan="2">Address</th><th>Amount</th><th colspan="2">TxID</th></tr></thead><tbody>';
            if (data.length > 0) {
                $.each(data, function (index, value) {
                    paymentList += '<tr>';
                    paymentList += '<td colspan="2">' + new Date(value.created).toLocaleString() + '</td>';
                    paymentList += '<td colspan="2"><a href="' + value.addressInfoLink + '" target="_blank">' + value.address.substring(0, 12) + ' &hellip; ' + value.address.substring(value.address.length - 12) + '</td>';
                    paymentList += '<td>' + (value.amount).toFixed(4) + '</td>';
                    paymentList += '<td colspan="3"><a href="' + value.transactionInfoLink + '" target="_blank">' + value.transactionConfirmationData.substring(0, 16) + ' &hellip; ' + value.transactionConfirmationData.substring(value.transactionConfirmationData.length - 16) + ' </a></td>';
                    paymentList += '</tr>';
                });
            } else {
                paymentList += '<tr><td colspan="3">No payments made.</td></tr>';
            }
            paymentList += '</tbody>';
            $('#paymentList').html(paymentList);
        })
        .fail(function () {
            $.notify({
                icon: "ti-cloud-down",
                message: "Error: No response from API.<br>(loadPaymentsList)",
            }, {
                type: 'danger',
                timer: 3000,
            });
        });
}

function loadConnectConfig() {
    return $.ajax(API + 'pools')
        .done(function (data) {
            var connectPoolConfig = '<thead><tr><th>Item</th><th>Value</th></tr></thead><tbody>';
            $.each(data.pools, function (index, value) {
                if (currentPool === value.id) {
                    algorithm = value.coin.algorithm;
                    connectPoolConfig += '<tr><td>Stratum URL</td><td>' + URLSTRATUM + '</td></tr>';
                    connectPoolConfig += '<tr><td>Algorithm</td><td>' + value.coin.algorithm + '</td></tr>';
                    connectPoolConfig += '<tr><td>Pool Address</td><td><a href="' + value.addressInfoLink + '" target="_blank">' + value.address.substring(0, 12) + ' &hellip; ' + value.address.substring(value.address.length - 12) + '</a></td></tr>';
                    connectPoolConfig += '<tr><td>Payout Scheme</td><td>' + value.paymentProcessing.payoutScheme + '</td></tr>';
                    connectPoolConfig += '<tr><td>Minimum Payment</td><td>' + value.paymentProcessing.minimumPayment + '</td></tr>';
                    if (typeof(value.paymentProcessing.minimumPaymentToPaymentId) !== "undefined") {
                        connectPoolConfig += '<tr><td>Minimum Payment w/ #</td><td>' + value.paymentProcessing.minimumPaymentToPaymentId + '</td></tr>';
                    }
                    connectPoolConfig += '<tr><td>Pool Fee</td><td>' + value.poolFeePercent + '%</td></tr>';
                    $.each(value.ports, function (port, options) {
                        connectPoolConfig += '<tr><td>Port ' + port + ' Difficulty</td><td>';
                        if (typeof(options.varDiff) !== "undefined") {
                            connectPoolConfig += 'Variable / ' + options.varDiff.minDiff + ' &harr; ';
                            if (typeof(options.varDiff.maxDiff) === "undefined") {
                                connectPoolConfig += '&infin;';
                            } else {
                                connectPoolConfig += options.varDiff.maxDiff;
                            }
                        } else {
                            connectPoolConfig += 'Static / ' + options.difficulty;
                        }
                        connectPoolConfig += '</td></tr>';
                    });
                }
            });
            connectPoolConfig += '</tbody>';
            $('#connectPoolConfig').html(connectPoolConfig);
            $('.algorithm').html(algorithm);

        })
        .fail(function () {
            $.notify({
                icon: "ti-cloud-down",
                message: "Error: No response from API.<br>(loadConnectConfig)",
            }, {
                type: 'danger',
                timer: 3000,
            });
        });
}
