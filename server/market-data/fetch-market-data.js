const axios = require("axios");
const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://admin:admin@ethereum-wallet-balance.bahyr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri);

let requestCount = 0;
let queryCompletionCount = 0;

const fetchMarketDataFromCoinGecko = async () => {
  console.log("Fetching market data");

  try {
    await client.connect();

    await client
      .db("dailyChangeData")
      .collection("dailyChangeData")
      .deleteMany({});

    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/list?include_platform=true"
    );

    let count = 0;
    let query = "";

    response.data.forEach((coin, index) => {
      if (coin.platforms) {
        if (coin.platforms.ethereum) {
          if (query === "") {
            query += coin.platforms.ethereum;
          } else {
            query += `%2C${coin.platforms.ethereum}`;
          }
          if (count % 150 === 0) {
            fetchDailyPriceChange(query);
            query = "";
          }
          count++;
        }
      }
    });

    if (query !== "") {
      fetchDailyPriceChange(query);
    }

    const ethereumPriceResponse = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true"
    );

    requestCount++;

    if (ethereumPriceResponse.data["ethereum"]) {
      client
        .db("dailyChangeData")
        .collection("dailyChangeData")
        .insertOne({
          _id: "ethereum",
          change: ethereumPriceResponse.data["ethereum"].usd_24h_change,
        })
        .then(async () => {
          queryCompletionCount++;

          if (queryCompletionCount === requestCount) {
            console.log("Closing client");
            queryCompletionCount = 0;
            requestCount = 0;
            await client.close();
          }
        })
        .catch(() => {
          queryCompletionCount++;
        });
    }
  } catch (error) {
    console.log(error);
  }
};

const fetchDailyPriceChange = (query) => {
  requestCount++;

  axios
    .get(
      `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${query}&vs_currencies=usd&include_24hr_change=true`
    )
    .then(async (response) => {
      let uploadData = [{}];

      for (let key of Object.keys(response.data)) {
        let newObject = {
          _id: key,
          change: response.data[key].usd_24h_change,
        };
        uploadData.push(newObject);
      }

      client
        .db("dailyChangeData")
        .collection("dailyChangeData")
        .insertMany(uploadData)
        .then(async () => {
          queryCompletionCount++;

          if (queryCompletionCount === requestCount) {
            console.log("Closing client");
            queryCompletionCount = 0;
            requestCount = 0;
            await client.close();
          }
        })
        .catch(() => {
          queryCompletionCount++;
        });
    })
    .catch((error) => {
      console.log(error);
    });
};

module.exports = fetchMarketDataFromCoinGecko;
