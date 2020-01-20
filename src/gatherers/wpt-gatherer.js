'use strict';

const assert = require('assert');
const Status = require('../common/status');

class Gatherer {
  constructor(config) {}
  run(test) {}
  retrieve(testId) {}
  parse(result) {}
  record(result) {}
}

class WebPageTestGatherer extends Gatherer {
  constructor(config, apiHelper) {
    super();
    assert(config, 'Parameter config is missing.');
    assert(apiHelper, 'Parameter apiHelper is missing.');

    this.runApiEndpoint = 'https://webpagetest.org/runtest.php';
    this.resultApiEndpoint = 'https://webpagetest.org/jsonResult.php';
    this.apiKey = config.apiKey;
    this.apiHelper = apiHelper;

    this.valueMap = {
      'testId': 'data.testId',

      'lighthouse.Performance': 'data.median.firstView[\'lighthouse.Performance\']',
      'lighthouse.PWA': 'data.median.firstView[\'lighthouse.ProgressiveWebApp\']',
      'lighthouse.FCP': 'data.median.firstView[\'lighthouse.Performance.first-contentful-paint\']',
      'lighthouse.FMP': 'data.median.firstView[\'lighthouse.Performance.first-meaningful-paint\']',
      'lighthouse.SpeedIndex': 'data.median.firstView[\'lighthouse.Performance.speed-index\']',
      'lighthouse.TTI': 'data.median.firstView[\'lighthouse.Performance.interactive\']',
      'lighthouse.CPUIdle': 'data.median.firstView[\'lighthouse.Performance.first-cpu-idle\']',

      'SpeedIndex': 'data.median.firstView.SpeedIndex',
      'TTFB': 'data.median.firstView.TTFB',
      'Render': 'data.median.firstView.render',
      'VisualComplete': 'data.median.firstView.visualComplete',
      'TTI': 'data.median.firstView.TTIMeasurementEnd',
      'LoadTime': 'data.median.firstView.loadTime',
      'RequestsDoc': 'data.median.firstView.requestsDoc',
      'DCL': 'data.median.firstView.domContentLoadedEventStart',
      'BytesIn': 'data.median.firstView.bytesIn',
      'DOMElements': 'data.median.firstView.domElements',

      'CSS': 'data.median.firstView.breakdown.css.bytes',
      'Fonts': 'data.median.firstView.breakdown.font.bytes',
      'Javascript': 'data.median.firstView.breakdown.js.bytes',
      'Images': 'data.median.firstView.breakdown.image.bytes',
      'Videos': 'data.median.firstView.breakdown.video.bytes'
    };
  }

  run(test, options) {
    assert(test, 'Parameter test is missing.');
    options = options || {};

    let params = {
      'url': encodeURIComponent(test.url),
      'k': this.apiKey,
      'f': 'json',
      'video': '1',
      'lighthouse': '1',
      'runs': test.runs || '1',
      'fvonly': test.firstViewOnly || true,
      'label': encodeURIComponent(test.label),
      'timeline': test.hasTimeline || false,
      'block': test.block || '',
      'script': test.script || '',
    }

    let urlParams = [];
    Object.keys(params).forEach(key => {
      urlParams.push(key + '=' + params[key]);
    });
    let url = this.runApiEndpoint + '?' + urlParams.join('&');

    if (options.debug) console.log(url);

    try {
      if (this.apiKey === 'TEST_API') return this.fakeResponse();

      let res = this.apiHelper.fetch(url);
      if (options.debug) console.log(url);

      let json = JSON.parse(res);
      if (options.debug) console.log(json);

      if (json.statusCode === 200) {
        return {
          status: Status.SUBMITTED,
          webpagetest: json.data,
        }
      } else if (json.statusCode === 400) {
        return {
          status: Status.ERROR,
          statusText: json.statusText,
        };
      } else {
        throw new Error('Unknown error');
      }
    } catch (error) {
      return {
        status: Status.ERROR,
        statusText: error.toString(),
      };
    }
  }

  retrieve(testId, options) {
    options = options || {};

    console.log('retrieve...');

    try {
      let urlParams = [
        'test=' + testId,
      ];
      let url = this.resultApiEndpoint + '?' + urlParams.join('&');
      if (options.debug) console.log(url);

      let res = this.apiHelper.fetch(url);
      let json = JSON.parse(res);
      if (options.debug) console.log(json);

      if (json.statusCode === 200) {
        let data = {};
        Object.keys(this.valueMap).forEach(key => {
          data[key] = eval('json.' + this.valueMap[key]);
        });
        return {
          status: Status.RETRIEVED,
          result: data,
          testId: json.data.testId,
        }
      } else if (json.statusCode === 400) {
        return {
          status: Status.ERROR,
          statusText: json.statusText,
        };
      } else {
        throw new Error('Unknown error');
      }
    } catch (error) {
      console.log(error);
      return {
        status: Status.ERROR,
        statusText: error.toString(),
      };
    }
  }

  parse(result) {

  }

  record(result) {

  }

  fakeResponse(result) {
    return {
      status: Status.SUBMITTED,
      testId: '200118_KA_4022ee20eaf1deebb393585731de6576',
      webpagetest: {
        testId: '200118_KA_4022ee20eaf1deebb393585731de6576',
        ownerKey: '9c58809d442152143c04bb7f1a711224aac3cfde',
        jsonUrl: 'https://webpagetest.org/jsonResult.php?test=200118_KA_4022ee20eaf1deebb393585731de6576',
        xmlUrl: 'https://webpagetest.org/xmlResult/200118_KA_4022ee20eaf1deebb393585731de6576/',
        userUrl: 'https://webpagetest.org/result/200118_KA_4022ee20eaf1deebb393585731de6576/',
        summaryCSV: 'https://webpagetest.org/result/200118_KA_4022ee20eaf1deebb393585731de6576/page_data.csv',
        detailCSV: 'https://webpagetest.org/result/200118_KA_4022ee20eaf1deebb393585731de6576/requests.csv'
      }
    };
  }
}

module.exports = WebPageTestGatherer;