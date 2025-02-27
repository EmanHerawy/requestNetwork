---
title: Portal Introduction
sidebar_label: Portal Introduction
keywords: [Request, REST, API, Tutorial, Portal]
description: Learn how to integrate Request network and its features.
---

import useBaseUrl from '@docusaurus/useBaseUrl';

Request Portal simplifies the use of the Request protocol, abstracting all the blockchain complexity. You can create requests and manage your users' requests through a REST API.

Our API accepts JSON-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes and Bearer authentication.

Aside from the guide, you can also consult [the Portal API documentation](/portal).

## Authentication

All API endpoints are authenticated.
Two mechanisms are currently allowed:

- API Key, explained below, to be used for scripting and test purposes
- OAuth, contact us: **Join our Discord** [**here**](https://request.network/discord)

## Portal outlook

If you have not already done it, head towards [Request Finance](https://app.request.finance) and create your account, you will need it to get your API keys and pursue the first steps of Request.

Once your account is created, you are able to:

- Create a request, which is useful for manual testing for example
- List requests you sent or received, useful for debugging
- Know your Request identity (cf. below)
- Access your API keys, by going to [My Account > API](https://app.request.finance/account/api-keys) to get your API Key.

## Request identity

Senders and recipients of money transfer requests need a way to trust each other. The identity is how we certify the debtor about the authenticity of the request sender, limiting frauds like SCAM for example.
With decentralized integration options (cf. [the Request client](/docs/guides/5-Request-client/0-intro), end users manage their private keys, but the Portal simplifies their life.

This simplification should be applied with great care, we do not recommend using the Request Portal API for critical cases where a lot of money or public reputation is at stake. If you want full control over the security of your finance, you should handle your keys, and the same applies to your users. Have a look at [the integration options](/integration-options) to take the best decision.

## How to list the requests associated with your identity

Head to the Portal to create a first manual request, and use the React snippet below to fetch requests associated with your identity

```jsx
import ReactDOM from 'react-dom';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_KEY = 'YOUR-API-KEY';

function RequestsList() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchResult = async () => {
      const result = await axios.get('https://api.request.network/requests/', {
        headers: { Authorization: API_KEY },
      });
      console.log(result);
      setRequests(result.data);
    };
    fetchResult();
  }, []);

  return (
    <div className="App">
      <h2>The most basic list of payment requests</h2>
      <ul>
        {requests.map((request) => {
          return (
            <li key={request.requestId}>
              {request.requestInput.expectedAmount} {request.requestInput.currency}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const rootElement = document.getElementById('root');
ReactDOM.render(<RequestsList />, rootElement);
```

The expected result should be a list of requests with amounts and currencies. Amounts are not displayed in a user-friendly way, but with all the decimals of their currencies.

As you can see, manipulating requests with the Portal API is very straight-forward. What you can notice is the use of `request.requestInput.expectedAmount` and `request.requestInput.currency`. We will detail on the next page how to manipulate different details of the request. You can also have more details on the [Portal API Docs](/portal).
