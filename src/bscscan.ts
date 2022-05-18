import { Builder, By, Key, ThenableWebDriver, until } from 'selenium-webdriver';
import chromedriver from 'chromedriver';
import chrome from 'selenium-webdriver/chrome';
import { ethers } from 'ethers';

class BscScanWrapper {
  provider: ethers.providers.JsonRpcProvider;
  private base_url: string;
  private width: number = 2560;
  private height: number = 1440;
  private _minTakerWBNBAmount: number = 2;
  private MAX_WALLETS = 15;
  private MIN_AMOUNT: any= 2;

  constructor() {
    this.base_url = 'https://bscscan.com/dextracker?q=';
    this.provider = new ethers.providers.JsonRpcProvider(
      `https://bsc-dataseed.binance.org/`,
      {
        name: 'Biance Mainnet',
        chainId: 56,
      }
    );
  }

  getEarlyBirds = async (_tokenAddress: string) => {
    let _driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(
        new chrome.Options()
          //   .windowSize({
          //     width: this.width,
          //     height: this.height,
          //   })
          .excludeSwitches('enable-automation')
      )
      .build();

    try {
      // 1. GET Number of Pages from the records available
      await _driver.get(`${this.base_url}${_tokenAddress}&ps=100`);

      let content = await _driver.findElement(By.id('content'));
      let cardBody = await content.findElement(By.css('.card .card-body'));
      let navigations = await cardBody.findElements(By.css('nav ul li'));
      let lastElement = navigations[navigations.length - 1];

      let lastPageUrl = await (
        await lastElement.findElement(By.css('a'))
      ).getAttribute('href');

      let lastPageNumber = parseInt(
        lastPageUrl.substring(lastPageUrl.indexOf('&p=') + 3) || '0'
      );

      // 2. Go back from last page to the first page or until max number of wallets is met

      let txns = [];
      for (let p = lastPageNumber; p >= 1; p--) {
        await _driver.get(`${this.base_url}${_tokenAddress}&ps=100&p=${p}`);

        content = await _driver.findElement(By.id('content'));
        cardBody = await content.findElement(By.css('.card .card-body'));
        let tRows = await cardBody.findElements(By.css('table tbody tr'));

        for (const tr of tRows) {
          let tds: any = await tr.findElements(By.css('td'));

          let txHash = await tds[0].getText();
          let time = await tds[1].getText();
          let maker = await tds[2].getText();
          let taker = await tds[4].getText();
          let price = await tds[5].getText();
          let dex = await tds[6]
            .findElement(By.css('img'))
            .getAttribute('data-original-title');

          // Filter Out By Taker
          // Only Txs abv _minTakerWBNBAmount
          let [amount, symbol] = taker.split(' ');
          if (
            parseFloat(amount) >= this._minTakerWBNBAmount &&
            symbol.trim() == 'WBNB'
          ) {
            let tx = await this.provider.getTransaction(txHash);
            let address = tx.from;
            let balance = ethers.utils.formatEther(
              await this.provider.getBalance(address)
            );

            if (balance >= this.MIN_AMOUNT) {              
            
            txns.push({
              txHash,
              time,
              maker,
              taker,
              price,
              dex,
              address,
              balance,
            });
            console.log(txns.length, {
              txHash,
              time,
              maker,
              taker,
              price,
              dex,
              address,
              balance,
            });
          }
        }
          // break limit coz limit has been reached
          if (txns.length >= this.MAX_WALLETS) {
            break;
          }
        }
      }
    } finally {
      await _driver.quit();
    }
  };
}

export const bscScanWrapper = new BscScanWrapper();
