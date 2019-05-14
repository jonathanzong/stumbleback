chrome.browserAction.onClicked.addListener(() => {

  chrome.storage.local.get(['stumble_last_read_time', 'stumble_items'], function(result) {
    let items = result.stumble_items || {};
    const now = new Date();
    if (result.stumble_last_read_time) {
      const diffTime = Math.abs(now.getTime() - result.stumble_last_read_time);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 1) {
        searchForUrls(new Date(result.stumble_last_read_time), now).then(function(result) {
          items = {...items, ...result};

          pickFromItems(items);
          chrome.storage.local.set({'stumble_items': items, 'stumble_last_read_time': now.getTime()});
        });
      }
      else {
        pickFromItems(items);
      }
    }
    else {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      searchForUrls(ninetyDaysAgo, now).then(function(result) {
        items = result;

        pickFromItems(items);
        chrome.storage.local.set({'stumble_items': items, 'stumble_last_read_time': now.getTime()});
      });
    }

    function pickFromItems(items) {
      const urls = Object.values(items);
      const pick = urls[Math.floor(Math.random()*urls.length)];

      chrome.tabs.create({url: pick});
    }

    function searchForUrls(startDate, endDate) {
      return new Promise((resolve, reject) => {
        chrome.history.search({
          text: '',
          startTime: startDate.getTime(),
          endTime: endDate.getTime()
        }, (historyItems) => {
          if (historyItems.length === 100) {
            const mid = midpointDate(startDate, endDate);
            Promise.all([searchForUrls(startDate, mid), searchForUrls(mid, endDate)])
              .then(() => {
                resolve(items);
              })
          }
          else {
            for (let item of historyItems) {
              items[item.id] = item.url;
            }
            resolve(items);
          }
        });
      });
    }

    function midpointDate(startDate, endDate) {
      return new Date((startDate.getTime() + endDate.getTime()) / 2);
    }

  });
});

