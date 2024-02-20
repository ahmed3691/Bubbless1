
        var ctx = document.getElementById('myChart').getContext('2d');
        var chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30','31'],
                datasets: [{
                        label:'Placed Orders',
                        tension: 0.3,
                        fill: true,
                        backgroundColor:'rgba(0, 0, 0, 0)',
                        borderColor: 'rgba(44, 120, 220)',
                        data: []
                    },
                    {
                        label:'Delivered Orders',
                        tension: 0.3,
                        fill: true,
                        backgroundColor:'rgba(0, 0, 0, 0)',
                        borderColor: '#65B741',
                        data: []
                    },
                    {
                        label:'Returned Orders',
                        tension: 0.3,
                        fill: true,
                        backgroundColor:'rgba(0, 0, 0, 0)',
                        borderColor: '#B80000',
                        data: []
                    },
                    {
                        label:'Cancelled Orders',
                        tension: 0.3,
                        fill: true,
                        backgroundColor:'rgba(0, 0, 0, 0)',
                        borderColor: '#FE7A36',
                        data: []
                    },
                    {
                        label:'Pending Orders',
                        tension: 0.3,
                        fill: true,
                        backgroundColor:'rgba(0, 0, 0, 0)',
                        borderColor: '#AC87C5',
                        data: []
                    }
                ]
            },
            options: {
                plugins: {
                legend: {
                    labels: {
                    usePointStyle: true,
                    },
                }
                }
            }
        });

        


   

    /*Sale statistics Chart*/

        var ctx2 = document.getElementById("myChart2");
        var myChart = new Chart(ctx2, {
            type: 'bar',
            data: {
            labels: ["Boys", "Girls","Unisex"],
            datasets: [
                {
                    label: "Category wise stock",
                    backgroundColor: ['#40A2D8','#F875AA','#9ADE7B'],
                    borderWidth: 1,
                    borderColor: '#000',
                    data: []
                }, 
            ]
            },
            options: {
                plugins: {
                    legend: {
                        labels: {
                        usePointStyle: true,
                        },
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

    ///Monthly report...................................................................

        var ctx3 = document.getElementById("monthlyData");
        var myChart2 = new Chart(ctx3, {
            type: 'bar',
            data: {
            labels: ["January", "February", "March", "April","May","June","July","August","September","October","November","December"],
            datasets: [
                {
                    label: "Revenue",
                    backgroundColor: "#5897fb",
                    
                    data: []
                }, 
                {
                    label: "Products Sold",
                    backgroundColor: "#7bcf86",
                   
                    data: []
                }
            ]
            },
            options: {
                plugins: {
                    legend: {
                        labels: {
                        usePointStyle: true,
                        },
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

    
// })(jQuery);