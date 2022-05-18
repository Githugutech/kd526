import { TransactionOrderForkEvent } from '@ethersproject/abstract-provider';
import { NodesmithProvider } from '@ethersproject/providers';
import { version } from 'chromedriver';
import { solidityKeccak256 } from 'ethers/lib/utils';
import { ableToSwitchToFrame, elementTextMatches } from 'selenium-webdriver/lib/until';
import { bscScanWrapper } from './bscscan';

const Main = async () => {
  console.log(`---`.repeat(5));
  console.log(`Starting....`);
  console.log(`---`.repeat(5));

  let tokenAddress = '0x6598463d6cbe4b51e9977437bf1200df4c45286c';
  await bscScanWrapper.getEarlyBirds(tokenAddress);
};

Main();
