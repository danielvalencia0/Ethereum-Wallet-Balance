import axios from "axios";

export class ERC20Token {
  constructor(
    ticker,
    price,
    coinBalance,
    usdBalance,
    logo,
    percentOfTotalPortfolio,
    uuid
  ) {
    this.ticker = ticker;
    this.price = price;
    this.coinBalance = coinBalance;
    this.usdBalance = usdBalance;
    this.logo = logo;
    this.percentOfTotalPortfolio = percentOfTotalPortfolio;
    this.uuid = uuid;
    this.twentyFourHourChange = "N/A";
  }

  fetch24HourChangeData = async (callback) => {
    axios
      .get(
        this.ticker.toLowerCase() === "eth"
          ? `http://localhost:8080/market-data/ethereum`
          : `http://localhost:8080/market-data/${this.uuid}`
      )
      .then((response) => {
        this.twentyFourHourChange = response.data;
        if (callback) {
          callback();
        }
      })
      .catch((error) => {
        this.twentyFourHourChange = "N/A";
        if (callback) {
          callback();
        }
      });
  };
}
