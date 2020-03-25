moment.locale('ro');
const isMobile = window.innerWidth < 768;
const defaultDateFormat = isMobile ? 'DD.MM' : 'DD MMMM';
const formatThousandsAsK = value => (value > 999 ? value / 1000 + 'k' : value);

function init() {
  cleanupData();
  setupBarLabels();
  setPickerCountries(window.data);
}

function draw() {
  var startTime;
  var endTime;

  startTime = performance.now();
  init();

  endTime = performance.now();
  console.log('After init: ', endTime - startTime);
  startTime = performance.now();

  drawDailyCasesChart('romaniaChart', 'Romania');
  setTimeout(() => {
    drawTotalsForCountry('romaniaTotals', 'Romania');
  }, 0);

  // endTime = performance.now();
  // console.log('After drawing first two: ', endTime - startTime);
  // startTime = performance.now();

  setTimeout(() => {
    drawGlobalActiveCases();
    show('globalActiveCasesWrapper', document.querySelector('button'));
  }, 1000);

  // endTime = performance.now();
  // console.log('After drawing third and showing: ', endTime - startTime);
  // startTime = performance.now();

  setTimeout(() => {
    drawCountryActiveCases('Romania');
    drawDailyCasesChart('otherCountryChart', 'Italy', '#ffeb3b');
    drawTotalsForCountry('otherCountryTotals', 'Italy', '#ffeb3b');
    drawTotalsChart();
    drawLastWeekChart();
    drawGlobalTotals();
  }, 2000);

  // endTime = performance.now();
  // console.log('DURATION: ', endTime - startTime);
  // startTime = performance.now();
}

function setCurrentDate() {
  const currentDateSpan = document.getElementById('currentDate');
  currentDateSpan.innerText = moment().format('DD MMMM YYYY');
}

var otherCountryChart = undefined;
var otherCountryChartTotals = undefined;
var countryActiveCases = undefined;

function drawDailyCasesChart(chartId, countryName, color = '#ff9800') {
  const ctx = document.getElementById(chartId).getContext('2d');
  const data = window.data;

  const countryData = data
    .sort((a, b) => +moment(b.DateRep, 'MM/DD/YYYY') - +moment(a.DateRep, 'MM/DD/YYYY'))
    .filter(x => x.CountryExp == countryName);

  const justLastTwentyDays = countryData.reverse().slice(countryData.length - (isMobile ? 15 : 25));

  const labels = justLastTwentyDays.map(x => moment(x.DateRep, 'MM/DD/YYYY').format(defaultDateFormat));
  const values = justLastTwentyDays.map(x => x.Cases);
  const deaths = justLastTwentyDays.map(x => +x.Deaths);
  const recoveries = justLastTwentyDays.map(x => +x.Recoveries);

  otherCountryChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Infectari',
          data: values,
          backgroundColor: color + '22',
          borderColor: color,
          borderWidth: 1
        },
        {
          label: 'Vindecari',
          data: recoveries,
          backgroundColor: '#4CAF5022',
          borderColor: '#4CAF50',
          borderWidth: 1
        },
        {
          label: 'Morti',
          data: deaths,
          backgroundColor: '#E91E6322',
          borderColor: '#E91E63',
          borderWidth: 1
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
              callback: formatThousandsAsK
            }
          }
        ]
      },
      layout: {
        padding: {
          right: 10
        }
      }
    }
  });
}

function drawTotalsChart() {
  const ctx = document.getElementById('totalsChart').getContext('2d');
  const data = window.data;

  const totals = {};

  data.forEach(x => {
    totals[x.CountryExp] = data
      .filter(y => y.CountryExp == x.CountryExp)
      .map(x => x.Cases)
      .reduce((a, b) => +a + +b);
  });

  const countriesWithTotals = Object.keys(totals).map(key => ({ countryName: key, total: totals[key] }));

  const sortedByTotalCases = countriesWithTotals.sort((a, b) => b.total - a.total).slice(0, 10);

  const labels = [...new Set(sortedByTotalCases.map(x => x.countryName))];
  const values = sortedByTotalCases.map(x => x.total);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Cazuri totale',
          data: values,
          backgroundColor: '#E91E6322',
          borderColor: '#E91E63',
          borderWidth: 1
        }
      ]
    },
    options: {
      animation: {
        duration: 0
      },
      maintainAspectRatio: false,
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
              callback: formatThousandsAsK
            }
          }
        ]
      }
    }
  });
}

const totals = {};

function drawCountryActiveCases(countryName) {
  const ctx = document.getElementById('countryActiveCases').getContext('2d');
  const data = window.data;

  const labels = [
    ...new Set(
      data.sort((a, b) => moment(a.DateRep, 'MM/DD/YYYY') - moment(b.DateRep, 'MM/DD/YYYY')).map(x => x.DateRep)
    )
  ];
  const localizedLabels = labels.map(x => moment(x, 'MM/DD/YYYY').format(defaultDateFormat));

  data.forEach(x => {
    totals[x.CountryExp] = data
      .filter(y => y.CountryExp == x.CountryExp)
      .map(x => x.Cases)
      .reduce((a, b) => +a + +b);
  });

  const countriesWithTotals = Object.keys(totals).map(key => ({ countryName: key, total: totals[key] }));
  const justThisCountry = countriesWithTotals.filter(x => x.countryName == countryName);

  const datasets = [];
  justThisCountry.forEach(({ countryName }) => {
    const firstCountryInfections = labels.map(x =>
      data
        .filter(y => y.DateRep == x && y.CountryExp == countryName)
        .map(x => x.Cases)
        .reduce((a, b) => +a + +b, 0)
    );
    const summedFirstCountryInfections = firstCountryInfections.map((x, i, a) => {
      const totalSoFar = firstCountryInfections.slice(0, i).reduce((a, b) => a + b, 0);
      return totalSoFar + x;
    });
    const firstCountryRecoveries = labels.map(x =>
      data
        .filter(y => y.DateRep == x && y.CountryExp == countryName)
        .map(x => x.Recoveries)
        .reduce((a, b) => +a + +b, 0)
    );
    const summedFirstCountryRecoveries = firstCountryRecoveries.map((x, i, a) => {
      const totalSoFar = firstCountryRecoveries.slice(0, i).reduce((a, b) => a + b, 0);
      return totalSoFar + x;
    });
    const firstCountryDeaths = labels.map(x =>
      data
        .filter(y => y.DateRep == x && y.CountryExp == countryName)
        .map(x => x.Deaths)
        .reduce((a, b) => +a + +b, 0)
    );
    const summedFirstCountryDeaths = firstCountryDeaths.map((x, i, a) => {
      const totalSoFar = firstCountryDeaths.slice(0, i).reduce((a, b) => a + b, 0);
      return totalSoFar + x;
    });

    const values = summedFirstCountryInfections.map(
      (x, i) => x - (summedFirstCountryRecoveries[i] + summedFirstCountryDeaths[i])
    );

    datasets.push(values);
  });

  const filterFunction = (x, i, a) => {
    if (i < (countryName == 'China' ? 30 : 50)) {
      return false;
    }

    const distanceFromPresent = a.length - i;

    const volumeToShow = isMobile ? 6 : 16;

    const rarifyingFactor = Math.floor(distanceFromPresent / volumeToShow) + 1;

    return i % rarifyingFactor == 0;
  };

  countryActiveCases = new Chart(ctx, {
    type: 'line',
    data: {
      labels: localizedLabels.filter(filterFunction),
      datasets: [
        {
          label: 'Cazuri active - ' + justThisCountry[0].countryName,
          data: datasets[0].filter(filterFunction),
          backgroundColor: '#5b9bd522',
          borderColor: '#5b9bd5',
          borderWidth: 2
        }
      ]
    },
    options: {
      animation: {
        duration: 0
      },
      maintainAspectRatio: false,
      scales: {
        yAxes: [
          {
            ticks: {
              fontColor: '#000',
              beginAtZero: true,
              callback: formatThousandsAsK
            }
          }
        ]
      },
      layout: {
        padding: {
          left: 0,
          right: 15,
          top: 0,
          bottom: 0
        }
      }
    }
  });
}

function drawGlobalActiveCases() {
  const ctx = document.getElementById('globalActiveCases').getContext('2d');
  const data = window.data;

  const labels = [
    ...new Set(
      data.sort((a, b) => moment(a.DateRep, 'MM/DD/YYYY') - moment(b.DateRep, 'MM/DD/YYYY')).map(x => x.DateRep)
    )
  ];
  const localizedLabels = labels.map(x => moment(x, 'MM/DD/YYYY').format(defaultDateFormat));

  data.forEach(x => {
    totals[x.CountryExp] = data
      .filter(y => y.CountryExp == x.CountryExp)
      .map(x => x.Cases)
      .reduce((a, b) => +a + +b);
  });

  const countriesWithTotals = Object.keys(totals).map(key => ({ countryName: key, total: totals[key] }));
  const sortedByTotalCases = countriesWithTotals.sort((a, b) => b.total - a.total).slice(0, 5);

  const datasets = [];
  sortedByTotalCases.forEach(({ countryName }) => {
    const firstCountryInfections = labels.map(x =>
      data
        .filter(y => y.DateRep == x && y.CountryExp == countryName)
        .map(x => x.Cases)
        .reduce((a, b) => +a + +b, 0)
    );
    const summedFirstCountryInfections = firstCountryInfections.map((x, i, a) => {
      const totalSoFar = firstCountryInfections.slice(0, i).reduce((a, b) => a + b, 0);
      return totalSoFar + x;
    });
    const firstCountryRecoveries = labels.map(x =>
      data
        .filter(y => y.DateRep == x && y.CountryExp == countryName)
        .map(x => x.Recoveries)
        .reduce((a, b) => +a + +b, 0)
    );
    const summedFirstCountryRecoveries = firstCountryRecoveries.map((x, i, a) => {
      const totalSoFar = firstCountryRecoveries.slice(0, i).reduce((a, b) => a + b, 0);
      return totalSoFar + x;
    });
    const firstCountryDeaths = labels.map(x =>
      data
        .filter(y => y.DateRep == x && y.CountryExp == countryName)
        .map(x => x.Deaths)
        .reduce((a, b) => +a + +b, 0)
    );
    const summedFirstCountryDeaths = firstCountryDeaths.map((x, i, a) => {
      const totalSoFar = firstCountryDeaths.slice(0, i).reduce((a, b) => a + b, 0);
      return totalSoFar + x;
    });

    const values = summedFirstCountryInfections.map(
      (x, i) => x - (summedFirstCountryRecoveries[i] + summedFirstCountryDeaths[i])
    );

    datasets.push(values);
  });

  const filterFunction = (x, i, a) => {
    if (i < (isMobile ? 30 : 30)) {
      return false;
    }

    if (i > a.length - 5) {
      return true;
    }

    return i % (isMobile ? 8 : 2) == 0 || i == a.length - 1;
  };

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: localizedLabels.filter(filterFunction),
      datasets: [
        {
          label: sortedByTotalCases[0].countryName,
          data: datasets[0].filter(filterFunction),
          backgroundColor: '#F4433600',
          borderColor: '#5b9bd5',
          borderWidth: 2
        },
        {
          label: sortedByTotalCases[1].countryName,
          data: datasets[1].filter(filterFunction),
          backgroundColor: '#F4433600',
          borderColor: '#ffc001',
          borderWidth: 2
        },
        {
          label: sortedByTotalCases[2].countryName,
          data: datasets[2].filter(filterFunction),
          backgroundColor: '#F4433600',
          borderColor: '#ed7d31',
          borderWidth: 2
        },
        {
          label: sortedByTotalCases[3].countryName,
          data: datasets[3].filter(filterFunction),
          backgroundColor: '#F4433600',
          borderColor: '#9C27B0',
          borderWidth: 2
        }
      ]
    },
    options: {
      animation: {
        duration: 0
      },
      maintainAspectRatio: false,
      scales: {
        yAxes: [
          {
            ticks: {
              fontColor: '#000',
              beginAtZero: true,
              callback: formatThousandsAsK
            }
          }
        ]
      },
      layout: {
        padding: {
          left: 0,
          right: 15,
          top: 0,
          bottom: 0
        }
      }
    }
  });
}

function drawTotalsChart() {
  const ctx = document.getElementById('totalsChart').getContext('2d');
  const data = window.data;

  const totals = {};

  data.forEach(x => {
    totals[x.CountryExp] = data
      .filter(y => y.CountryExp == x.CountryExp)
      .map(x => x.Cases)
      .reduce((a, b) => +a + +b);
  });

  const countriesWithTotals = Object.keys(totals).map(key => ({ countryName: key, total: totals[key] }));

  const sortedByTotalCases = countriesWithTotals.sort((a, b) => b.total - a.total).slice(0, 10);

  const labels = [...new Set(sortedByTotalCases.map(x => x.countryName))];
  const values = sortedByTotalCases.map(x => x.total);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Cazuri totale',
          data: values,
          backgroundColor: '#E91E6322',
          borderColor: '#E91E63',
          borderWidth: 1
        }
      ]
    },
    options: {
      animation: {
        duration: 0
      },
      maintainAspectRatio: false,
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
              callback: formatThousandsAsK
            }
          }
        ]
      }
    }
  });
}

function drawLastWeekChart() {
  const ctx = document.getElementById('lastWeekTotals').getContext('2d');
  const data = window.data;

  const validData = data.filter(x => moment().diff(moment(x.DateRep, 'MM/DD/YYYY'), 'days') <= 7);

  const totals = {};

  validData.forEach(x => {
    totals[x.CountryExp] = validData
      .filter(y => y.CountryExp == x.CountryExp)
      .map(x => x.Cases)
      .reduce((a, b) => +a + +b);
  });

  const countriesWithTotals = Object.keys(totals).map(key => ({ countryName: key, total: totals[key] }));

  const sortedByTotalCases = countriesWithTotals.sort((a, b) => b.total - a.total).slice(0, 10);

  const labels = [...new Set(sortedByTotalCases.map(x => x.countryName))];
  const values = sortedByTotalCases.map(x => x.total);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Confirmed cases in the last 7 days',
          data: values,
          backgroundColor: '#9c27b022',
          borderColor: '#9c27b0',
          borderWidth: 1
        }
      ]
    },
    options: {
      animation: {
        duration: 0
      },
      maintainAspectRatio: false,
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
              callback: formatThousandsAsK
            }
          }
        ]
      }
    }
  });
}

function drawTotalsForCountry(chartId, countryName, color = '#ff9800') {
  const ctx = document.getElementById(chartId).getContext('2d');
  const data = window.data;

  const labels = [
    ...new Set(
      data
        .sort((a, b) => moment(a.DateRep, 'MM/DD/YYYY') - moment(b.DateRep, 'MM/DD/YYYY'))
        .map(x => x.DateRep, 'MM/DD/YYYY')
    )
  ];
  const localizedLabels = labels.map(x => moment(x, 'MM/DD/YYYY').format(defaultDateFormat));
  const values = labels.map(x =>
    data
      .filter(y => y.DateRep == x && y.CountryExp == countryName)
      .map(x => x.Cases)
      .reduce((a, b) => +a + +b, 0)
  );
  const deaths = labels.map(x =>
    data
      .filter(y => y.DateRep == x && y.CountryExp == countryName)
      .map(x => x.Deaths)
      .reduce((a, b) => +a + +b, 0)
  );
  const recoveries = labels.map(x =>
    data
      .filter(y => y.DateRep == x && y.CountryExp == countryName)
      .map(x => x.Recoveries)
      .reduce((a, b) => +a + +b, 0)
  );

  const summedDailyValues = values.map((x, i, a) => {
    const totalSoFar = values.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });

  const summedDailyDeaths = deaths.map((x, i, a) => {
    const totalSoFar = deaths.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });

  const summedDailyRecoveries = recoveries.map((x, i, a) => {
    const totalSoFar = recoveries.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });

  const filterFunction = (x, i, a) => {
    if (i < a.length - (isMobile ? 30 : 40)) {
      return false;
    }

    const distanceFromPresent = a.length - i;

    const volumeToShow = isMobile ? 7 : 16;

    const rarifyingFactor = Math.floor(distanceFromPresent / volumeToShow) + 1;

    return i % rarifyingFactor == 0;
  };

  otherCountryChartTotals = new Chart(ctx, {
    type: 'line',
    data: {
      labels: localizedLabels.filter(filterFunction),
      datasets: [
        {
          label: 'Infectari - ' + countryName,
          data: summedDailyValues.filter(filterFunction),
          backgroundColor: color + '22',
          borderColor: color,
          borderWidth: 1
        },
        {
          label: 'Vindecari - ' + countryName,
          data: summedDailyRecoveries.filter(filterFunction),
          backgroundColor: '#4CAF5022',
          borderColor: '#4CAF50',
          borderWidth: 1
        },
        {
          label: 'Morti - ' + countryName,
          data: summedDailyDeaths.filter(filterFunction),
          backgroundColor: '#E91E6322',
          borderColor: '#E91E63',
          borderWidth: 1
        }
      ]
    },
    options: {
      animation: {
        duration: 0
      },
      maintainAspectRatio: false,
      scales: {
        yAxes: [
          {
            ticks: {
              fontColor: '#000',
              beginAtZero: true,
              callback: formatThousandsAsK
            }
          }
        ]
      },
      layout: {
        padding: {
          right: 10
        }
      }
    }
  });
}

function drawGlobalTotals() {
  const ctx = document.getElementById('globalTotals').getContext('2d');
  const data = window.data;

  const labels = [
    ...new Set(
      data.sort((a, b) => moment(a.DateRep, 'MM/DD/YYYY') - moment(b.DateRep, 'MM/DD/YYYY')).map(x => x.DateRep)
    )
  ];
  const localizedLabels = labels.map(x => moment(x, 'MM/DD/YYYY').format(defaultDateFormat));
  const values = labels.map(x =>
    data
      .filter(y => y.DateRep == x)
      .map(x => x.Cases)
      .reduce((a, b) => +a + +b, 0)
  );
  const deaths = labels.map(x =>
    data
      .filter(y => y.DateRep == x)
      .map(x => x.Deaths)
      .reduce((a, b) => +a + +b, 0)
  );
  const recoveries = labels.map(x =>
    data
      .filter(y => y.DateRep == x)
      .map(x => x.Recoveries)
      .reduce((a, b) => +a + +b, 0)
  );

  const summedDailyValues = values.map((x, i, a) => {
    const totalSoFar = values.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });

  const summedDailyDeaths = deaths.map((x, i, a) => {
    const totalSoFar = deaths.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });

  const summedDailyRecoveries = recoveries.map((x, i, a) => {
    const totalSoFar = recoveries.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });

  const filterFunction = (x, i, a) => {
    const distanceFromPresent = a.length - i;

    const volumeToShow = isMobile ? 6 : 16;

    const rarifyingFactor = Math.floor(distanceFromPresent / volumeToShow) + 1;

    return i % rarifyingFactor == 0;
  };

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: localizedLabels.filter(filterFunction),
      datasets: [
        {
          label: 'Infectari - toata lumea',
          data: summedDailyValues.filter(filterFunction),
          backgroundColor: '#ff980022',
          borderColor: '#ff9800',
          borderWidth: 1
        },
        {
          label: 'Vindecari - toata lumea',
          data: summedDailyRecoveries.filter(filterFunction),
          backgroundColor: '#4CAF5022',
          borderColor: '#4CAF50',
          borderWidth: 1
        },
        {
          label: 'Morti - toata lumea',
          data: summedDailyDeaths.filter(filterFunction),
          backgroundColor: '#E91E6322',
          borderColor: '#E91E63',
          borderWidth: 1
        }
      ]
    },
    options: {
      animation: {
        duration: 0
      },
      maintainAspectRatio: false,
      scales: {
        yAxes: [
          {
            ticks: {
              fontColor: '#000',
              beginAtZero: true,
              callback: formatThousandsAsK
            }
          }
        ]
      },
      layout: {
        padding: {
          left: 0,
          right: 15,
          top: 0,
          bottom: 0
        }
      }
    }
  });
}

function maybeAddEntryForRomaniaToday() {
  const romaniaEntries = window.data.filter(x => x['Countries and territories'] == 'Romania');
  const todayString = moment().format('MM/DD/YYYY');
  if (!romaniaEntries.find(x => x.DateRep == todayString)) {
    const currentHour = moment().format('HH');
    if (currentHour > 12) {
      window.data = [
        ...window.data,
        { 'Countries and territories': 'Romania', DateRep: todayString, Deaths: 0, Recoveries: 0, Cases: 0 }
      ];
    }
  }
}

const recoveriesCountriesMap = {
  'Korea, South': 'South Korea'
};

const recoveries = {};

function populateRecoveriesObject() {
  const allCountries = [...new Set(window.recoveredData.map(x => x['Country/Region']))];
  const allDates = Object.keys(window.recoveredData[0]).filter(x => x.includes('/20'));
  console.log('allDates', allDates);

  allDates.forEach((date, i) => {
    const casesForAllCountriesForCurrentDate = {};
    allCountries.forEach(countryName => {
      casesForAllCountriesForCurrentDate[countryName.replace(/[\s\_]/g, '').toLowerCase()] = window.recoveredData
        .filter(x => x['Country/Region'] == countryName)
        .map(x => x[date])
        .reduce((a, b) => a + b);
    });

    recoveries[date] = casesForAllCountriesForCurrentDate;
  });
}

function getRecoveriesForToday(countryName, dateRep) {
  debugger;
  const yesterdaysKey = moment(dateRep, 'MM/DD/YYYY')
    .subtract(1, 'day')
    .format('M/D/YY');
  const todaysKey = moment(dateRep, 'MM/DD/YYYY').format('M/D/YY');

  const todaysRecoveries = recoveries[todaysKey]?.[countryName] || 0;
  const yesterdaysRecoveries = recoveries[yesterdaysKey]?.[countryName] || 0;

  return todaysRecoveries ? todaysRecoveries - yesterdaysRecoveries : 0;
}

function cleanupData() {
  maybeAddEntryForRomaniaToday();

  populateRecoveriesObject();

  window.data = window.data.map(x => {
    let countryName = x['Countries and territories'].replace(/\_/g, ' ');
    if (countryName.toLowerCase().startsWith('united states')) {
      countryName = 'USA';
    }
    if (countryName.startsWith('Cases')) {
      countryName = 'Diamond Princess';
    }
    if (countryName.toLowerCase().startsWith('canada')) {
      countryName = 'Canada';
    }

    x.Recoveries = getRecoveriesForToday(countryName.replace(/[\s\_]/g, '').toLowerCase(), x.DateRep);

    // if (countryName == 'Romania') {
    //   x = { ...x, ...window.romaniaData[x.DateRep] };
    // }
    if (countryName == 'Italy') {
      if (x.DateRep == '03/16/2020') {
        x.Cases = '3230';
      }
      if (x.DateRep == '03/15/2020') {
        x.Cases = '3090';
      }
    }
    return {
      ...x,
      CountryExp: countryName
    };
  });
}

function drawComparedCountry(picker) {
  otherCountryChart.destroy();

  drawDailyCasesChart('otherCountryChart', picker.value, '#ffeb3b');
}

function drawComparedCountryTotalCases(picker) {
  otherCountryChartTotals.destroy();
  drawTotalsForCountry('otherCountryTotals', picker.value, '#ffeb3b');
}

function drawComparedActiveCases(picker) {
  countryActiveCases.destroy();
  drawCountryActiveCases(picker.value);
}

function setPickerCountries(data) {
  const pickers = document.querySelectorAll('.country-picker');

  const countries = [...new Set(data.map(x => x.CountryExp))];

  pickers.forEach(picker => {
    countries.forEach(countryName => {
      const option = document.createElement('option');
      option.innerText = countryName;
      picker.appendChild(option);
    });
    picker.value = picker.id == 'activeCasesCountryPicker' ? 'Romania' : 'Italy';
  });
}

function setupBarLabels() {
  Chart.pluginService.register({
    afterDraw: function(chartInstance) {
      var ctx = chartInstance.chart.ctx;

      ctx.font = Chart.helpers.fontString(
        Chart.defaults.global.defaultFontSize,
        'normal',
        Chart.defaults.global.defaultFontFamily
      );
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#000';

      chartInstance.data.datasets.forEach(function(dataset) {
        for (var i = 0; i < dataset.data.length; i++) {
          var model = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._model;
          const currentValue = dataset.data[i];
          let formattedValue = currentValue > 9999 ? Math.floor(dataset.data[i] / 1000) + 'k' : dataset.data[i];

          if (isMobile) {
            const thousands = (currentValue / 1000).toFixed(1);
            const endsWithZero = thousands.endsWith('.0');
            const thousandsWithoutZero = (dataset.data[i] / 1000).toFixed(endsWithZero ? 0 : 1);

            formattedValue = formattedValue > 999 ? thousandsWithoutZero + 'k' : formattedValue;
          }

          if (currentValue > 0) {
            ctx.fillText(formattedValue, model.x, model.y - 2);
          }
        }
      });
    }
  });
}

function show(graphId, button) {
  document.querySelectorAll('button').forEach(x => {
    x.removeAttribute('selected');
  });
  document.querySelectorAll('.graph-wrapper').forEach(x => {
    x.removeAttribute('visible');
  });

  button.toggleAttribute('selected');

  const wrapper = document.getElementById(graphId);
  wrapper.toggleAttribute('visible');
}

setCurrentDate();
setTimeout(() => {
  draw();
}, 0);
