import React, { useState } from 'react';
import './App.css';

function App() {

  var [accountId, setAccountId] = useState("");
  var [currentAccountId, setCurrentAccountId] = useState("");
  var [topPayments, setTopPayments] = useState([]);
  var [loadingError, setLoadingError] = useState(null);

  var getAccountTransactions = () => {
    var headers = {
      "x-api-key": "YOUR DRAGONGLASS API KEY",
    };

    fetch(`https://api.dragonglass.me/hedera/api/accounts/${accountId}/transactions?size=1000`, { headers })
      .then(res => {
        if (res.status == 200) {
          return res.json()
        } else {
          throw `Error while connecting to DragonGlass: ${res.status}`;
        }
      })
      .then(
        (result) => {
        var accounts = {};
          // For every data entry in the response (holds transaction details)
          result["data"].forEach((data) => {
            // For every transfer in the transaction (includes what accounts were credited and debited)
            data["transfers"].forEach((transfer) => {
              // Make sure that we only include accounts that are not our own, that were debited during transaction.
              if (transfer["accountID"] !== accountId && transfer["amount"] > 0) {
                if(!(transfer["accountID"] in accounts)) {
                  accounts[transfer["accountID"]] = 0;
                }
                accounts[transfer["accountID"]] += transfer["amount"];
              }
            })
          });

          var sortedKeys = Object.keys(accounts);
          sortedKeys.sort((a, b) => accounts[a] - accounts[b]).reverse()

          var sortedAccounts = sortedKeys.map(key => {
            return {
              accountId: key,
              amount: accounts[key],
            }
          });

          sortedAccounts = sortedAccounts.filter((account) => account.amount > 0);

          setTopPayments(sortedAccounts);
          setCurrentAccountId(accountId);
          setLoadingError(null);
        },
        (error) => {
          setLoadingError(error);
          console.error(error);
        }
      );
  };

  return (
    <div className="App">
      <div className="container">
        <h1 className="page-header">
          Where'd my hbar go?
        </h1>
        <form 
          id="search-form"
          onSubmit={(e) => {
            e.preventDefault();
            getAccountTransactions();
          }}
        >
          <input 
            placeholder="Enter an account ID e.g. 0.0.1234" 
            onChange={(e) => {
              setAccountId(e.target.value);
            }}
          />
          <button type="submit">
            View
          </button>
        </form>
        {
          currentAccountId !== "" && loadingError == null ?
          <div className="leaderboard">
            <div className="leaderboard-header">
              <h2 className="leaderboard-title">
                Who has account {currentAccountId} sent the most ℏ to?
              </h2>
            </div>
            <div className="leaderboard-body">
              {
                topPayments.map(
                  (account, index) => (
                    <div className="leaderboard-entry">
                      <span className="ranking-number">{index + 1}. </span> 
                      <span className="ranking-account">{account.accountId}</span> 
                      <br />
                      <span className="ranking-amount"> {(account.amount / 100000000).toFixed(2)} ℏ</span>
                    </div>
                  )
                )
              }
            </div>
          </div> : (
            loadingError ? <div>{loadingError}</div> : null
          )
        }
      </div>
    </div>
  );
}

export default App;
