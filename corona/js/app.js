moment.locale('ro');
const isMobile = window.innerWidth < 768;
const defaultDateFormat = isMobile ? 'DD.MM' : 'DD MMMM';
const formatThousandsAsK = value => (value > 999 ? value / 1000 + 'k' : value);

function init() {
  cleanupData();
  setTimeout(() => {
    populateLabelsSinceStartOfYear();
    setupBarLabels();
    setPickerCountries(window.data);
  }, 0);
}

var startTime;
var endTime;

function draw() {
  init();

  drawRomaniaCountyCasesPie();
  drawRomaniaAgeCasesPie();
  // drawRomaniaSexCasesPie();
  drawDailyCasesChart('romaniaChart', 'Romania');
  setTimeout(() => {
    drawTotalsForCountry('romaniaTotals', 'Romania');

    drawGlobalActiveCases();
    show('globalActiveCasesWrapper', document.querySelector('button'));

    drawDailyCasesChart('otherCountryChart', 'Italy', '#ffeb3b'); //8
    drawCountryActiveCases('Romania'); // 29
    drawTotalsForCountry('otherCountryTotals', 'Italy', '#ffeb3b'); //30
    drawLastWeekTotalsBars(); //122
    drawAllTimeTotalsBars(); //22
    drawGlobalTotals(); //22
  }, 1000);
}

function setCurrentDate() {
  const currentDateSpan = document.getElementById('pageTitle');
  currentDateSpan.innerText = 'Situatia COVID-19 la data de ' + moment().format('DD MMMM YYYY');
}

var otherCountryChart = undefined;
var otherCountryChartTotals = undefined;
var countryActiveCases = undefined;

function drawRomaniaCountyCasesPie() {
  const ctx = document.getElementById('romaniaCountyDeaths').getContext('2d');
  const data = window.romaniaDeaths;

  let labels = [...new Set(data.map(x => x.county))]
    .sort((a, b) => data.filter(y => y.county == b).length - data.filter(y => y.county == a).length)
    .slice(0, 7);

  const othersValue = data.filter(x => !labels.includes(x.county)).length;
  const values = [...labels.map(x => data.filter(y => y.county == x).length), othersValue];

  document.querySelectorAll('.total-deaths').forEach(x => (x.innerText = data.length));

  otherCountryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [...labels, 'Restul - in total'].map(
        (x, i) => '\n' + x[0].toUpperCase() + x.substr(1) + ': ' + values[i]
      ),
      datasets: [
        {
          label: 'Morti pe judet',
          data: values,
          backgroundColor: ['#ff5722', '#ff9800', '#ffc107', '#ffeb3b', '#cddc39', '#8bc34a', '#4caf50', '#009688']
        }
      ]
    },
    options: {
      legend: {
        display: false
      },
      maintainAspectRatio: false,
      layout: {
        padding: {
          right: 50,
          left: 60
        }
      },
      plugins: {
        labels: {
          render: 'label',
          precision: 0,
          showZero: true,
          fontSize: 12,
          fontColor: '#444',
          fontStyle: 'normal',
          fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          textShadow: true,
          shadowBlur: 10,
          shadowOffsetX: -5,
          shadowOffsetY: 5,
          shadowColor: '#0000',
          arc: false,
          position: 'outside',
          overlap: true,
          showActualPercentages: true,
          images: [
            {
              src: 'image.png',
              width: 16,
              height: 16
            }
          ],
          outsidePadding: 4,
          textMargin: 7
        }
      }
    }
  });
}

function drawRomaniaAgeCasesPie() {
  const ctx = document.getElementById('romaniaAgeDeaths').getContext('2d');
  const data = window.romaniaDeaths;

  const intervals = [
    {
      min: 0,
      max: 40,
      label: '<40 ani'
    },
    {
      min: 20,
      max: 40,
      label: '20-40 ani'
    },
    {
      min: 40,
      max: 60,
      label: '40-60 ani'
    },
    {
      min: 60,
      max: 100,
      label: '60+ ani'
    }
  ];

  let labels = intervals.map(x => x.label || x.min + ' - ' + x.max);
  const values = intervals.map(x => data.filter(y => y.age > x.min && y.age <= x.max).length);

  otherCountryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels.map((x, i) => x + ' (' + ((values[i] / data.length) * 100).toFixed(1) + '%)'),
      datasets: [
        {
          label: 'Morti pe grupe de varsta',
          data: values,
          backgroundColor: ['#009688bb', '#4caf50bb', '#ff9800', '#ff5722']
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        labels: {
          render: ({ value }) => {
            return value;
          },
          precision: 0,
          showZero: true,
          fontSize: 14,
          fontColor: '#fff',
          fontStyle: 'normal',
          fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          textShadow: true,
          shadowBlur: 10,
          shadowOffsetX: -5,
          shadowOffsetY: 5,
          shadowColor: '#0000',
          arc: false,
          // position: 'outside',
          overlap: true,
          showActualPercentages: true,
          outsidePadding: 4,
          textMargin: 15
        }
      }
    }
  });
}

function drawRomaniaSexCasesPie() {
  const ctx = document.getElementById('romaniaSexDeaths').getContext('2d');
  const data = window.romaniaDeaths;

  let labels = ['Barbati', 'Femei'];
  const values = [data.filter(x => !x.gender).length, data.filter(x => x.gender).length];

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Morti pe sex',
          data: values,
          backgroundColor: ['#2196f3', '#F06292']
        }
      ]
    },
    options: {
      legend: {
        display: false
      },
      maintainAspectRatio: false,
      plugins: {
        labels: {
          render: ({ value, percentage, label }) => {
            return `${label}: ${value} (${percentage}%)`;
          },
          precision: 0,
          showZero: true,
          fontSize: 14,
          fontColor: '#fff',
          fontStyle: 'normal',
          fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          textShadow: true,
          shadowBlur: 10,
          shadowOffsetX: -5,
          shadowOffsetY: 5,
          shadowColor: '#0000',
          arc: false,
          // position: 'outside',
          overlap: true,
          showActualPercentages: true,
          outsidePadding: 4,
          textMargin: 15
        }
      }
    }
  });
}

function drawDailyCasesChart(chartId, countryName, color = '#ff9800') {
  const ctx = document.getElementById(chartId).getContext('2d');
  const data = window.data;

  const countryData = data
    .filter(x => x.CountryExp == countryName)
    .sort((a, b) => +moment(b.dateRep, 'MM/DD/YYYY') - +moment(a.dateRep, 'MM/DD/YYYY'))
    .slice(0, isMobile ? 10 : 20)
    .reverse();

  const labels = countryData.map(x => moment(x.dateRep, 'MM/DD/YYYY').format(defaultDateFormat));
  const values = countryData.map(x => x.cases);
  const deaths = countryData.map(x => +x.deaths);
  const recoveries = countryData.map(x => +x.recoveries);

  new Chart(ctx, {
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

function drawAllTimeTotalsBars() {
  const ctx = document.getElementById('totalsChart').getContext('2d');
  const data = window.data;

  const totals = {};

  const allCountries = [...new Set(data.map(x => x.CountryExp))];

  allCountries.forEach(countryName => {
    totals[countryName] = data
      .filter(y => y.CountryExp == countryName)
      .map(x => x.cases)
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

function drawCountryActiveCases(countryName) {
  const ctx = document.getElementById('countryActiveCases').getContext('2d');
  const data = window.data;

  const labels = dayStringsSinceStartOfYear;
  const localizedLabels = labels.map(x => moment(x, 'MM/DD/YYYY').format(defaultDateFormat));

  const firstCountryInfections = labels.map(x =>
    data
      .filter(y => y.dateRep == x && y.CountryExp == countryName)
      .map(x => x.cases)
      .reduce((a, b) => +a + +b, 0)
  );
  const summedFirstCountryInfections = firstCountryInfections.map((x, i, a) => {
    const totalSoFar = firstCountryInfections.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });
  const firstCountryrecoveries = labels.map(x =>
    data
      .filter(y => y.dateRep == x && y.CountryExp == countryName)
      .map(x => x.recoveries)
      .reduce((a, b) => +a + +b, 0)
  );
  const summedFirstCountryrecoveries = firstCountryrecoveries.map((x, i, a) => {
    const totalSoFar = firstCountryrecoveries.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });
  const firstCountrydeaths = labels.map(x =>
    data
      .filter(y => y.dateRep == x && y.CountryExp == countryName)
      .map(x => x.deaths)
      .reduce((a, b) => +a + +b, 0)
  );
  const summedFirstCountrydeaths = firstCountrydeaths.map((x, i, a) => {
    const totalSoFar = firstCountrydeaths.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });

  const values = summedFirstCountryInfections.map(
    (x, i) => x - (summedFirstCountryrecoveries[i] + summedFirstCountrydeaths[i])
  );

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
          label: 'Cazuri active - ' + countryName,
          data: values.filter(filterFunction),
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

  const labels = dayStringsSinceStartOfYear;
  const localizedLabels = labels.map(x => moment(x, 'MM/DD/YYYY').format(defaultDateFormat));

  const topCountries = ['China', 'USA', 'Italy', 'Spain'];

  const datasets = [];
  topCountries.forEach(countryName => {
    const thisCountryData = data.filter(y => y.CountryExp == countryName);

    const activeCases = labels.map(x => {
      const { cases = 0, recoveries = 0, deaths = 0 } = thisCountryData.find(y => y.dateRep == x) || {};

      return +cases - (+recoveries + +deaths);
    });

    const summedActiveCases = activeCases.map((x, i, a) => {
      const totalSoFar = a.slice(0, i).reduce((a, b) => a + b, 0);
      return totalSoFar + x;
    });

    datasets.push(summedActiveCases);
  });

  const filterFunction = (_, i, a) => {
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
          label: topCountries[0],
          data: datasets[0].filter(filterFunction),
          backgroundColor: '#F4433600',
          borderColor: '#5b9bd5',
          borderWidth: 2
        },
        {
          label: topCountries[1],
          data: datasets[1].filter(filterFunction),
          backgroundColor: '#F4433600',
          borderColor: '#ffc001',
          borderWidth: 2
        },
        {
          label: topCountries[2],
          data: datasets[2].filter(filterFunction),
          backgroundColor: '#F4433600',
          borderColor: '#ed7d31',
          borderWidth: 2
        },
        {
          label: topCountries[3],
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
      minValueForLabel: 250,
      labelsToIgnore: ['8166', '2127', '6935', '14k', '1144', '1910', '416'],
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

function drawLastWeekTotalsBars() {
  const ctx = document.getElementById('lastWeekTotals').getContext('2d');
  const data = window.data.filter(x => +new Date() - +new Date(x.dateRep) < 7 * 24 * 60 * 60 * 1000);

  const totals = {};

  const allCountries = [...new Set(data.map(x => x.CountryExp))];

  allCountries.forEach(countryName => {
    totals[countryName] = data
      .filter(y => y.CountryExp == countryName)
      .map(x => x.cases)
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

  const localizedLabels = dayStringsSinceStartOfYear.map(x => moment(x, 'MM/DD/YYYY').format(defaultDateFormat));
  const values = dayStringsSinceStartOfYear.map(x =>
    data
      .filter(y => y.dateRep == x && y.CountryExp == countryName)
      .map(x => x.cases)
      .reduce((a, b) => +a + +b, 0)
  );

  const deaths = dayStringsSinceStartOfYear.map(x =>
    data
      .filter(y => y.dateRep == x && y.CountryExp == countryName)
      .map(x => x.deaths)
      .reduce((a, b) => +a + +b, 0)
  );
  const recoveries = dayStringsSinceStartOfYear.map(x =>
    data
      .filter(y => y.dateRep == x && y.CountryExp == countryName)
      .map(x => x.recoveries)
      .reduce((a, b) => +a + +b, 0)
  );

  const summedDailyValues = values.map((x, i, a) => {
    const totalSoFar = values.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });

  const summedDailydeaths = deaths.map((x, i, a) => {
    const totalSoFar = deaths.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });

  const summedDailyrecoveries = recoveries.map((x, i, a) => {
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
          data: summedDailyrecoveries.filter(filterFunction),
          backgroundColor: '#4CAF5022',
          borderColor: '#4CAF50',
          borderWidth: 1
        },
        {
          label: 'Morti - ' + countryName,
          data: summedDailydeaths.filter(filterFunction),
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
          right: 13
        }
      }
    }
  });
}

function drawGlobalTotals() {
  const ctx = document.getElementById('globalTotals').getContext('2d');
  const data = window.data;

  const labels = dayStringsSinceStartOfYear;
  const localizedLabels = labels.map(x => moment(x, 'MM/DD/YYYY').format(defaultDateFormat));
  const values = labels.map(x =>
    data
      .filter(y => y.dateRep == x)
      .map(x => x.cases)
      .reduce((a, b) => +a + +b, 0)
  );
  const deaths = labels.map(x =>
    data
      .filter(y => y.dateRep == x)
      .map(x => x.deaths)
      .reduce((a, b) => +a + +b, 0)
  );
  const recoveries = labels.map(x =>
    data
      .filter(y => y.dateRep == x)
      .map(x => x.recoveries)
      .reduce((a, b) => +a + +b, 0)
  );

  const summedDailyValues = values.map((x, i, a) => {
    const totalSoFar = values.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });

  const summedDailydeaths = deaths.map((x, i, a) => {
    const totalSoFar = deaths.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });

  const summedDailyrecoveries = recoveries.map((x, i, a) => {
    const totalSoFar = recoveries.slice(0, i).reduce((a, b) => a + b, 0);
    return totalSoFar + x;
  });

  const filterFunction = (_, i, a) => {
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
          data: summedDailyrecoveries.filter(filterFunction),
          backgroundColor: '#4CAF5022',
          borderColor: '#4CAF50',
          borderWidth: 1
        },
        {
          label: 'Morti - toata lumea',
          data: summedDailydeaths.filter(filterFunction),
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
  const romaniaEntries = window.data.filter(x => x['countriesAndTerritories'] == 'Romania');
  const todayString = moment().format('MM/DD/YYYY');
  const maybeMissingDays = [todayString, '03/03/2020', '03/05/2020'];

  maybeMissingDays.forEach(maybeMissingDay => {
    if (!romaniaEntries.find(x => x.dateRep == maybeMissingDay)) {
      const currentHour = moment().format('HH');
      if (+currentHour > 12 || maybeMissingDay !== todayString) {
        window.data = [
          ...window.data,
          { countriesAndTerritories: 'Romania', dateRep: maybeMissingDay, deaths: 0, recoveries: 0, cases: 0 }
        ];
      }
    }
  });
}

const recoveriesCountriesMap = {
  'Korea, South': 'southkorea',
  US: 'USA'
};

const recoveries = {};

function populaterecoveriesObject() {
  const allCountries = [...new Set(window.recoveredData.map(x => x['Country/Region']))];
  const allDates = Object.keys(window.recoveredData[0]).filter(x => x.includes('/20'));

  allDates.forEach((date, i) => {
    const casesForAllCountriesForCurrentDate = {};
    allCountries.forEach(recoveredCountryName => {
      casesForAllCountriesForCurrentDate[
        (recoveriesCountriesMap[recoveredCountryName] || recoveredCountryName.replace(/[\s\_]/g, '')).toLowerCase()
      ] = window.recoveredData
        .filter(x => x['Country/Region'] == recoveredCountryName)
        .map(x => x[date])
        .reduce((a, b) => a + b, 0);
    });

    recoveries[date] = casesForAllCountriesForCurrentDate;
  });
}

function getRecoveriesForToday(countryName, dateRep) {
  const yesterdaysKey = moment(dateRep, 'MM/DD/YYYY')
    .subtract(1, 'day')
    .format('M/D/YY');
  const todaysKey = moment(dateRep, 'MM/DD/YYYY').format('M/D/YY');

  const todaysRecoveries = (recoveries[todaysKey] || {})[countryName] || 0;
  const yesterdaysRecoveries = (recoveries[yesterdaysKey] || {})[countryName] || 0;

  return todaysRecoveries ? todaysRecoveries - yesterdaysRecoveries : 0;
}

function cleanupData() {
  maybeAddEntryForRomaniaToday();

  populaterecoveriesObject();

  window.data = window.data.map(x => {
    let countryName = x['countriesAndTerritories'].replace(/\_/g, ' ');
    if (countryName.toLowerCase().startsWith('united states of amer')) {
      countryName = 'USA';
    }
    if (countryName.startsWith('cases')) {
      countryName = 'Diamond Princess';
    }
    if (countryName.toLowerCase().startsWith('canada')) {
      countryName = 'Canada';
    }

    x.recoveries = getRecoveriesForToday(countryName.replace(/[\s\_]/g, '').toLowerCase(), x.dateRep);

    if (countryName == 'Romania') {
      const { cases = 0, recoveries = 0, deaths = 0 } = window.romaniaData[x.dateRep] || {};
      x.cases = cases;
      x.recoveries = recoveries;
      x.deaths = deaths;
    }
    if (countryName == 'Italy') {
      if (x.dateRep == '03/16/2020') {
        x.cases = '3230';
      }
      if (x.dateRep == '03/15/2020') {
        x.cases = '3090';
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

      if (!['line', 'bar'].includes(chartInstance.config.type)) {
        return;
      }

      ctx.font = Chart.helpers.fontString(
        Chart.defaults.global.defaultFontSize,
        'normal',
        Chart.defaults.global.defaultFontFamily
      );
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#000';

      const { minValueForLabel = 0, labelsToIgnore = [] } = chartInstance.options;

      chartInstance.data.datasets.forEach(dataset => {
        for (var i = 0; i < dataset.data.length; i++) {
          var model = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._model;
          const currentValue = dataset.data[i];
          let formattedValue = currentValue > 9999 ? Math.floor(dataset.data[i] / 1000) + 'k' : dataset.data[i] + '';

          if (isMobile) {
            const thousands = (currentValue / 1000).toFixed(1);
            const endsWithZero = thousands.endsWith('.0');
            const thousandsWithoutZero = (dataset.data[i] / 1000).toFixed(endsWithZero ? 0 : 1);

            formattedValue = formattedValue > 999 ? thousandsWithoutZero + 'k' : formattedValue;
          }

          if (currentValue > minValueForLabel && !labelsToIgnore.includes(formattedValue)) {
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

let dayStringsSinceStartOfYear = [];

function populateLabelsSinceStartOfYear() {
  dayStringsSinceStartOfYear = [
    ...new Set(
      window.data
        .filter(x => x['countriesAndTerritories'] == 'China' || x['countriesAndTerritories'] == 'Romania')
        .map(x => x.dateRep)
    )
  ].sort((a, b) => moment(a, 'MM/DD/YYYY') - moment(b, 'MM/DD/YYYY'));
}

setCurrentDate();
draw();
