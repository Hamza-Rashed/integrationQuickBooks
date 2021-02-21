'use strict';
require('dotenv').config();
/**
 * Require the dependencies
 */
const
    express = require('express'),
    port = process.env.PORT,
    app = express(),
    OAuthClient = require('intuit-oauth'),
    bodyParser = require('body-parser'),
    QuickBooks = require('./index'),
    openNewTap = require('open');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.listen(port , ()=>{
  console.log('server is running '+port)
  requestToken();
})

const config = {
  key: process.env.KEY,
  secret: process.env.SECRET,
  environment: process.env.ENVIROMENT,
  redirectUri: process.env.REDIRECTURI,
  realmId : process.env.REALMID,
}

/**
 * App Variables
 * @type {null}
 */
let oauth2_token_json = null;

/**
 * Instantiate new Client
 * @type {OAuthClient}
 */

let oauthClient = null;

/**
 * Get the AuthorizeUri
 */

function requestToken() {
  oauthClient = new OAuthClient({
    clientId: config.key,
    clientSecret: config.secret,
    environment: config.environment,
    redirectUri: config.redirectUri,
    companyId : config.realmId
  });

  const authUri = oauthClient.authorizeUri({
    scope: [OAuthClient.scopes.Accounting],
    state: 'intuit-test',
  });
  openNewTap(authUri , function (err){
    throw err
  })
};

/**
 * Handle the callback to extract the `Auth Code` and exchange them for `Bearer-Tokens`
 */

app.get('/callback', function (req, res) {
  oauthClient
    .createToken(req.url)
    .then(function (authResponse) {
      oauth2_token_json = JSON.stringify(authResponse.getJson(), null, 2);
      getRefreshToken();
    })
    .catch(function (e) {
      console.error(e);
    });
  res.send('');

});

/**
 * Refresh the access-token
 */
function getRefreshToken() {
  
  oauthClient
    .refresh()
    .then(function (authResponse) {
      oauth2_token_json = JSON.stringify(authResponse.getJson(), null, 2);
    })
    let accessToken = JSON.parse(oauth2_token_json)
   console.log('Done Create New Token And Refresh For it' , accessToken)
   return accessToken;
}

/**
 * 
 * @param account_id  { for the account} 
 * 
 * How to use ???
 * 
 * Just enter the id of the account which you want
 * 
 * output : all details about that account
 * 
 * @param SampleForResponse
 * 
{
  "Account": {
    "FullyQualifiedName": "Accounts Payable (A/P)", 
    "domain": "QBO", 
    "Name": "Accounts Payable (A/P)", 
    "Classification": "Liability", 
    "AccountSubType": "AccountsPayable", 
    "CurrentBalanceWithSubAccounts": -1091.23, 
    "sparse": false, 
    "MetaData": {
      "CreateTime": "2014-09-12T10:12:02-07:00", 
      "LastUpdatedTime": "2015-06-30T15:09:07-07:00"
    }, 
    "AccountType": "Accounts Payable", 
    "CurrentBalance": -1091.23, 
    "Active": true, 
    "SyncToken": "0", 
    "Id": "33", 
    "SubAccount": false
  }, 
  "time": "2015-07-13T12:50:36.72-07:00"
}
 */

const get_account = async (account_id) => {
  let TokenInfo = getRefreshToken()
  let access_token = await authenticate(TokenInfo);
  access_token.getAccount(account_id, (err, account_details) => {
    if (err) throw err
    else return account_details
  })
}
/**
 * 
 * @param Name  {max character: max 100 characters .... and ... User recognizable name for the Account. Account.Name attribute must not contain double quotes (") or colon (:).} 
 * @param AcctNum {User-defined account number to help the user in identifying the account within the chart-of-accounts and in deciding what should be posted to the account. The Account.AcctNum attribute must not contain colon (:). For France locales:
Name must be unique.
Length must be between 6 and 15 characters
Must start with the account number from the master category list.
Name limited to alpha-numeric characters.
. Required for France locales} 
 * @param TaxCodeRef {minorVersion: 3}  
 * @param  AccountType {A detailed account classification that specifies the use of this account. The type is based on the Classification.
Required if AccountSubType is not specified.} 
 * @param AccountSubType {The account sub-type classification and is based on the AccountType value.
Required if AccountType is not specified.}  
*
* @param SampleForResponse
* 
{
  "Account": {
    "FullyQualifiedName": "MyJobs", 
    "domain": "QBO", 
    "Name": "MyJobs", 
    "Classification": "Asset", 
    "AccountSubType": "AccountsReceivable", 
    "CurrencyRef": {
      "name": "United States Dollar", 
      "value": "USD"
    }, 
    "CurrentBalanceWithSubAccounts": 0, 
    "sparse": false, 
    "MetaData": {
      "CreateTime": "2014-12-31T09:29:05-08:00", 
      "LastUpdatedTime": "2014-12-31T09:29:05-08:00"
    }, 
    "AccountType": "Accounts Receivable", 
    "CurrentBalance": 0, 
    "Active": true, 
    "SyncToken": "0", 
    "Id": "94", 
    "SubAccount": false
  }, 
  "time": "2014-12-31T09:29:05.717-08:00"
}
 */
const create_account = async (Name, AcctNum, TaxCodeRef, AccountType, AccountSubType) => {
  let TokenInfo = getRefreshToken()
  let access_token = await authenticate(TokenInfo);
  let info = {
    Name: Name,
    AcctNum: AcctNum,
    TaxCodeRef: TaxCodeRef,
    AccountType: AccountType,
    AccountSubType: AccountSubType
  }
  access_token.createAccount(info, (err, account_details) => {
    if (err) throw err
    else return account_details
  })
}

/**
 * 
 * @param account_id {id the account which you wanna to update it}  
 * @param Name  {max character: max 100 characters ... and ...User recognizable name for the Account. Account.Name attribute must not contain double quotes (") or colon (:)} 
 * @param SyncToken  {Version number of the object. It is used to lock an object for use by one app at a time. As soon as an application modifies an object, its SyncToken is incremented. Attempts to modify an object specifying an older SyncToken fails. Only the latest version of the object is maintained by QuickBooks Online.} 
 * @param AcctNum {User-defined account number to help the user in identifying the account within the chart-of-accounts and in deciding what should be posted to the account. The Account.AcctNum attribute must not contain colon (:).
Name must be unique.
For French Locales:
Length must be between 6 and 15 characters
Must start with the account number from the master category list.
Name limited to alpha-numeric characters.
Max length for Account.AcctNum:
AU & CA: 20 characters.
US, UK & IN: 7 characters} 
*
* @param SampleForResponse
*
*{
  "Account": {
    "FullyQualifiedName": "Accounts Payable (A/P)", 
    "domain": "QBO", 
    "SubAccount": false, 
    "Description": "Description added during update.", 
    "Classification": "Liability", 
    "AccountSubType": "AccountsPayable", 
    "CurrentBalanceWithSubAccounts": -1091.23, 
    "sparse": false, 
    "MetaData": {
      "CreateTime": "2014-09-12T10:12:02-07:00", 
      "LastUpdatedTime": "2015-07-13T15:35:13-07:00"
    }, 
    "AccountType": "Accounts Payable", 
    "CurrentBalance": -1091.23, 
    "Active": true, 
    "SyncToken": "1", 
    "Id": "33", 
    "Name": "Accounts Payable (A/P)"
  }, 
  "time": "2015-07-13T15:31:25.618-07:00"
}
*
 */
const update_account = async (account_id, Name, SyncToken, AcctNum) => {
  let TokenInfo = getRefreshToken()
  let access_token = await authenticate(TokenInfo);
  let info = {
    Name: Name,
    AcctNum: AcctNum,
    SyncToken: SyncToken,
    account_id: account_id
  }
  access_token.updateAccount(info, (err, account_details) => {
    if (err) throw err
    else return account_details
  })
}

/**
 * 
 * @param bill_id {the id for the Bill which you want}  
 * 
 * @param SampleForResponse
 * 
 * {
  "Bill": {
    "SyncToken": "2", 
    "domain": "QBO", 
    "APAccountRef": {
      "name": "Accounts Payable (A/P)", 
      "value": "33"
    }, 
    "VendorRef": {
      "name": "Norton Lumber and Building Materials", 
      "value": "46"
    }, 
    "TxnDate": "2014-11-06", 
    "TotalAmt": 103.55, 
    "CurrencyRef": {
      "name": "United States Dollar", 
      "value": "USD"
    }, 
    "LinkedTxn": [
      {
        "TxnId": "118", 
        "TxnType": "BillPaymentCheck"
      }
    ], 
    "SalesTermRef": {
      "value": "3"
    }, 
    "DueDate": "2014-12-06", 
    "sparse": false, 
    "Line": [
      {
        "DetailType": "AccountBasedExpenseLineDetail", 
        "Amount": 103.55, 
        "Id": "1", 
        "AccountBasedExpenseLineDetail": {
          "TaxCodeRef": {
            "value": "TAX"
          }, 
          "AccountRef": {
            "name": "Job Expenses:Job Materials:Decks and Patios", 
            "value": "64"
          }, 
          "BillableStatus": "Billable", 
          "CustomerRef": {
            "name": "Travis Waldron", 
            "value": "26"
          }
        }, 
        "Description": "Lumber"
      }
    ], 
    "Balance": 0, 
    "Id": "25", 
    "MetaData": {
      "CreateTime": "2014-11-06T15:37:25-08:00", 
      "LastUpdatedTime": "2015-02-09T10:11:11-08:00"
    }
  }, 
  "time": "2015-02-09T10:17:20.251-08:00"
}
 */
const get_bill = async (bill_id) => {
  let TokenInfo = getRefreshToken()
  let access_token = await authenticate(TokenInfo);
  access_token.getBill(bill_id, (err, bill_details) => {
    if (err) throw err
    else return bill_details;
  })
}

/**
 * 
 * @param VendorRef {Reference to the vendor for this transaction. Query the Vendor name list resource to determine the appropriate Vendor object for this reference. Use Vendor.Id and Vendor.Name from that object for VendorRef.value and VendorRef.name, respectively.}  
 * @param Line  {The minimum line item required for the request.} 
 * @param CurrencyRef  {Reference to the currency in which all amounts on the associated transaction are expressed. This must be defined if multicurrency is enabled for the company.
Multicurrency is enabled for the company if Preferences.MultiCurrencyEnabled is set to true. Read more about multicurrency support here. Required if multicurrency is enabled for the company.} 
* 
* @param SampleForResponse
*
*{
  "Bill": {
    "SyncToken": "0", 
    "domain": "QBO", 
    "VendorRef": {
      "name": "Bob's Burger Joint", 
      "value": "56"
    }, 
    "TxnDate": "2014-12-31", 
    "TotalAmt": 200.0, 
    "APAccountRef": {
      "name": "Accounts Payable (A/P)", 
      "value": "33"
    }, 
    "Id": "151", 
    "sparse": false, 
    "Line": [
      {
        "DetailType": "AccountBasedExpenseLineDetail", 
        "Amount": 200.0, 
        "Id": "1", 
        "AccountBasedExpenseLineDetail": {
          "TaxCodeRef": {
            "value": "NON"
          }, 
          "AccountRef": {
            "name": "Advertising", 
            "value": "7"
          }, 
          "BillableStatus": "NotBillable"
        }
      }
    ], 
    "Balance": 200.0, 
    "DueDate": "2014-12-31", 
    "MetaData": {
      "CreateTime": "2014-12-31T09:59:18-08:00", 
      "LastUpdatedTime": "2014-12-31T09:59:18-08:00"
    }
  }, 
  "time": "2014-12-31T09:59:17.449-08:00"
}
*/
const create_bill = async (VendorRef, Line, CurrencyRef) => {
  let TokenInfo = getRefreshToken()
  let access_token = await authenticate(TokenInfo);
  let info = {
    VendorRef: VendorRef,
    Line: Line,
    CurrencyRef: CurrencyRef
  }
  access_token.createBill(info, (err, bill_details) => {
    if (err) throw err
    else return bill_details
  })
}

/**
 * 
 * @param bill_id  {Unique identifier for this object. Sort order is ASC by default.} 
 * @param VendorRef  {Reference to the vendor for this transaction. Query the Vendor name list resource to determine the appropriate Vendor object for this reference. Use Vendor.Id and Vendor.Name from that object for VendorRef.value and VendorRef.name, respectively.} 
 * @param Line  {Individual line items of a transaction. Valid Line types include: ItemBasedExpenseLine and AccountBasedExpenseLine}
 * @param SyncToken  {Version number of the object. It is used to lock an object for use by one app at a time. As soon as an application modifies an object, its SyncToken is incremented. Attempts to modify an object specifying an older SyncToken fails. Only the latest version of the object is maintained by QuickBooks Online.}
 * @param CurrencyRef  {Reference to the currency in which all amounts on the associated transaction are expressed. This must be defined if multicurrency is enabled for the company. Multicurrency is enabled for the company if Preferences.MultiCurrencyEnabled is set to true. Read more about multicurrency support here. Required if multicurrency is enabled for the company.}
 *
 * @param SampleForResponse
 * 
 * {
  "Bill": {
    "DocNumber": "56789", 
    "SyncToken": "2", 
    "domain": "QBO", 
    "APAccountRef": {
      "name": "Accounts Payable", 
      "value": "49"
    }, 
    "VendorRef": {
      "name": "Bayshore CalOil Service", 
      "value": "81"
    }, 
    "TxnDate": "2014-04-04", 
    "TotalAmt": 200.0, 
    "CurrencyRef": {
      "name": "United States Dollar", 
      "value": "USD"
    }, 
    "PrivateNote": "This is a updated memo.", 
    "SalesTermRef": {
      "value": "12"
    }, 
    "DepartmentRef": {
      "name": "Garden Services", 
      "value": "1"
    }, 
    "DueDate": "2013-06-09", 
    "sparse": false, 
    "Line": [
      {
        "DetailType": "AccountBasedExpenseLineDetail", 
        "Amount": 200.0, 
        "Id": "1", 
        "AccountBasedExpenseLineDetail": {
          "TaxCodeRef": {
            "value": "TAX"
          }, 
          "AccountRef": {
            "name": "Automobile", 
            "value": "75"
          }, 
          "BillableStatus": "Billable", 
          "CustomerRef": {
            "name": "Blackwell, Edward", 
            "value": "20"
          }, 
          "MarkupInfo": {
            "Percent": 10
          }
        }, 
        "Description": "Gasoline"
      }
    ], 
    "Balance": 200.0, 
    "Id": "890", 
    "MetaData": {
      "CreateTime": "2014-04-04T12:38:01-07:00", 
      "LastUpdatedTime": "2014-04-04T12:58:16-07:00"
    }
  }, 
  "time": "2014-04-04T12:58:16.491-07:00"
}
 */
const update_bill = async (bill_id, VendorRef, Line, SyncToken, CurrencyRef) => {
  let TokenInfo = getRefreshToken()
  let access_token = await authenticate(TokenInfo);

  let info = {
    bill_id: bill_id,
    VendorRef: VendorRef,
    SyncToken: SyncToken,
    Line: Line,
    CurrencyRef: CurrencyRef
  }
  access_token.updateBill(info, (err, bill_details) => {
    if (err) throw err
    else return bill_details
  })
}

/**
 * 
 * @param customer_id {the id for the customer that you wanted} 
 * 
 * @param SampleForResponse
 * 
 * {
  "Customer": {
    "PrimaryEmailAddr": {
      "Address": "Surf@Intuit.com"
    }, 
    "SyncToken": "0", 
    "domain": "QBO", 
    "GivenName": "Bill", 
    "DisplayName": "Bill's Windsurf Shop", 
    "BillWithParent": false, 
    "FullyQualifiedName": "Bill's Windsurf Shop", 
    "CompanyName": "Bill's Windsurf Shop", 
    "FamilyName": "Lucchini", 
    "sparse": false, 
    "PrimaryPhone": {
      "FreeFormNumber": "(415) 444-6538"
    }, 
    "Active": true, 
    "Job": false, 
    "BalanceWithJobs": 85.0, 
    "BillAddr": {
      "City": "Half Moon Bay", 
      "Line1": "12 Ocean Dr.", 
      "PostalCode": "94213", 
      "Lat": "37.4307072", 
      "Long": "-122.4295234", 
      "CountrySubDivisionCode": "CA", 
      "Id": "3"
    }, 
    "PreferredDeliveryMethod": "Print", 
    "Taxable": false, 
    "PrintOnCheckName": "Bill's Windsurf Shop", 
    "Balance": 85.0, 
    "Id": "2", 
    "MetaData": {
      "CreateTime": "2014-09-11T16:49:28-07:00", 
      "LastUpdatedTime": "2014-09-18T12:56:01-07:00"
    }
  }, 
  "time": "2015-07-23T11:04:15.496-07:00"
}
 */
const get_customer = async (customer_id) => {
  let TokenInfo = getRefreshToken()
  let access_token = await authenticate(TokenInfo);

  access_token.getCustomer(customer_id, (err, customer_details) => {
    if (err) throw err
    else return customer_details;
  })
}

/**
 * 
 * @param DisplayName {max character: maximum of 500 chars .. and .. The name of the person or organization as displayed. Must be unique across all Customer, Vendor, and Employee objects. Cannot be removed with sparse update. If not supplied, the system generates DisplayName by concatenating customer name components supplied in the request from the following list: Title, GivenName, MiddleName, FamilyName, and Suffix.} DisplayName 
 * @param Suffix {max character: maximum of 16 chars .. and .. Suffix of the name. For example, Jr. The DisplayName attribute or at least one of Title, GivenName, MiddleName, FamilyName, or Suffix attributes is required for object create.} Suffix 
 * @param Title  {max character: maximum of 16 chars .. and .. Title of the person. This tag supports i18n, all locales. The DisplayName attribute or at least one of Title, GivenName, MiddleName, FamilyName, Suffix, or FullyQualifiedName attributes are required during create.} Title 
 * @param MiddleName  {max character: maximum of 100 chars .. and .. Middle name of the person. The person can have zero or more middle names. The DisplayName attribute or at least one of Title, GivenName, MiddleName, FamilyName, or Suffix attributes is required for object create.} MiddleName 
 * @param FamilyName {max character: maximum of 100 chars .. and .. Family name or the last name of the person. The DisplayName attribute or at least one of Title, GivenName, MiddleName, FamilyName, or Suffix attributes is required for object create.} FamilyName 
 * @param GivenName {max character: maximum of 100 chars .. and .. Given name or first name of a person. The DisplayName attribute or at least one of Title, GivenName, MiddleName, FamilyName, or Suffix attributes is required for object create} GivenName 
 * 
 * @param SampleForResponse
 * 
 * {
  "Customer": {
    "domain": "QBO", 
    "PrimaryEmailAddr": {
      "Address": "jdrew@myemail.com"
    }, 
    "DisplayName": "King's Groceries", 
    "CurrencyRef": {
      "name": "United States Dollar", 
      "value": "USD"
    }, 
    "DefaultTaxCodeRef": {
      "value": "2"
    }, 
    "PreferredDeliveryMethod": "Print", 
    "GivenName": "James", 
    "FullyQualifiedName": "King's Groceries", 
    "BillWithParent": false, 
    "Title": "Mr", 
    "Job": false, 
    "BalanceWithJobs": 0, 
    "PrimaryPhone": {
      "FreeFormNumber": "(555) 555-5555"
    }, 
    "Taxable": true, 
    "MetaData": {
      "CreateTime": "2015-07-23T10:58:12-07:00", 
      "LastUpdatedTime": "2015-07-23T10:58:12-07:00"
    }, 
    "BillAddr": {
      "City": "Mountain View", 
      "Country": "USA", 
      "Line1": "123 Main Street", 
      "PostalCode": "94042", 
      "CountrySubDivisionCode": "CA", 
      "Id": "112"
    }, 
    "MiddleName": "B", 
    "Notes": "Here are other details.", 
    "Active": true, 
    "Balance": 0, 
    "SyncToken": "0", 
    "Suffix": "Jr", 
    "CompanyName": "King Groceries", 
    "FamilyName": "King", 
    "PrintOnCheckName": "King Groceries", 
    "sparse": false, 
    "Id": "67"
  }, 
  "time": "2015-07-23T10:58:12.099-07:00"
}
 */
const create_customer = async (DisplayName, Suffix, Title, MiddleName, FamilyName, GivenName) => {
  let TokenInfo = getRefreshToken()
  let access_token = await authenticate(TokenInfo);
  let info = {
    DisplayName: DisplayName,
    Suffix: Suffix,
    Title: Title,
    MiddleName: MiddleName,
    FamilyName: FamilyName,
    GivenName: GivenName
  }
  access_token.createCustomer(info, (err, customer_details) => {
    if (err) throw err
    else return customer_details
  })
}

/**
 * 
 * @param customer_id {Unique identifier for this object. Sort order is ASC by default.
} 
 * @param SyncToken  {Version number of the object. It is used to lock an object for use by one app at a time. As soon as an application modifies an object, its SyncToken is incremented. Attempts to modify an object specifying an older SyncToken fails. Only the latest version of the object is maintained by QuickBooks Online.}
 * @param DisplayName {max character: maximum of 500 chars .. and .. The name of the person or organization as displayed. Must be unique across all Customer, Vendor, and Employee objects. Cannot be removed with sparse update. If not supplied, the system generates DisplayName by concatenating customer name components supplied in the request from the following list: Title, GivenName, MiddleName, FamilyName, and Suffix.} DisplayName 
 * @param Suffix {max character: maximum of 16 chars .. and .. Suffix of the name. For example, Jr. The DisplayName attribute or at least one of Title, GivenName, MiddleName, FamilyName, or Suffix attributes is required for object create.} Suffix 
 * @param Title  {max character: maximum of 16 chars .. and .. Title of the person. This tag supports i18n, all locales. The DisplayName attribute or at least one of Title, GivenName, MiddleName, FamilyName, Suffix, or FullyQualifiedName attributes are required during create.} Title 
 * @param MiddleName  {max character: maximum of 100 chars .. and .. Middle name of the person. The person can have zero or more middle names. The DisplayName attribute or at least one of Title, GivenName, MiddleName, FamilyName, or Suffix attributes is required for object create.} MiddleName 
 * @param FamilyName {max character: maximum of 100 chars .. and .. Family name or the last name of the person. The DisplayName attribute or at least one of Title, GivenName, MiddleName, FamilyName, or Suffix attributes is required for object create.} FamilyName 
 * @param GivenName {max character: maximum of 100 chars .. and .. Given name or first name of a person. The DisplayName attribute or at least one of Title, GivenName, MiddleName, FamilyName, or Suffix attributes is required for object create} GivenName 
 * 
 * @param SampleForResponse
 * 
 * {
  "Customer": {
    "domain": "QBO", 
    "PrimaryEmailAddr": {
      "Address": "Surf@Intuit.com"
    }, 
    "DisplayName": "Bill's Windsurf Shop", 
    "PreferredDeliveryMethod": "Print", 
    "GivenName": "Bill", 
    "FullyQualifiedName": "Bill's Windsurf Shop", 
    "BillWithParent": false, 
    "Job": false, 
    "BalanceWithJobs": 85.0, 
    "PrimaryPhone": {
      "FreeFormNumber": "(415) 444-6538"
    }, 
    "Active": true, 
    "MetaData": {
      "CreateTime": "2014-09-11T16:49:28-07:00", 
      "LastUpdatedTime": "2015-07-23T11:18:37-07:00"
    }, 
    "BillAddr": {
      "City": "Half Moon Bay", 
      "Line1": "12 Ocean Dr.", 
      "PostalCode": "94213", 
      "Lat": "37.4307072", 
      "Long": "-122.4295234", 
      "CountrySubDivisionCode": "CA", 
      "Id": "3"
    }, 
    "MiddleName": "Mac", 
    "Taxable": false, 
    "Balance": 85.0, 
    "SyncToken": "4", 
    "CompanyName": "Bill's Windsurf Shop", 
    "FamilyName": "Lucchini", 
    "PrintOnCheckName": "Bill's Wind Surf Shop", 
    "sparse": false, 
    "Id": "2"
  }, 
  "time": "2015-07-23T11:18:37.323-07:00"
}
 */
const update_customer = async (customer_id, SyncToken, DisplayName, Suffix, Title, MiddleName, FamilyName, GivenName) => {
  let TokenInfo = getRefreshToken()
  let access_token = await authenticate(TokenInfo);

  let info = {
    customer_id: customer_id,
    DisplayName: DisplayName,
    SyncToken: SyncToken,
    Suffix: Suffix,
    Title: Title,
    MiddleName: MiddleName,
    FamilyName: FamilyName,
    GivenName: GivenName
  }
  access_token.updateCustomer(info, (err, customer_details) => {
    if (err) throw err
    else return customer_details
  })
}
/**
 * 
 * @param order_id {the id for the order that you wanted}  
 * 
 * @param SampleForResponse
 * 
 * {
  "Estimate": {
    "DocNumber": "1001", 
    "SyncToken": "0", 
    "domain": "QBO", 
    "TxnStatus": "Pending", 
    "BillEmail": {
      "Address": "Cool_Cars@intuit.com"
    }, 
    "TxnDate": "2015-03-26", 
    "TotalAmt": 31.5, 
    "CustomerRef": {
      "name": "Cool Cars", 
      "value": "3"
    }, 
    "CustomerMemo": {
      "value": "Thank you for your business and have a great day!"
    }, 
    "ShipAddr": {
      "CountrySubDivisionCode": "CA", 
      "City": "Half Moon Bay", 
      "PostalCode": "94213", 
      "Id": "104", 
      "Line1": "65 Ocean Dr."
    }, 
    "PrintStatus": "NeedToPrint", 
    "BillAddr": {
      "CountrySubDivisionCode": "CA", 
      "City": "Half Moon Bay", 
      "PostalCode": "94213", 
      "Id": "103", 
      "Line1": "65 Ocean Dr."
    }, 
    "sparse": false, 
    "EmailStatus": "NotSet", 
    "Line": [
      {
        "Description": "Pest Control Services", 
        "DetailType": "SalesItemLineDetail", 
        "SalesItemLineDetail": {
          "TaxCodeRef": {
            "value": "NON"
          }, 
          "Qty": 1, 
          "UnitPrice": 35, 
          "ItemRef": {
            "name": "Pest Control", 
            "value": "10"
          }
        }, 
        "LineNum": 1, 
        "Amount": 35.0, 
        "Id": "1"
      }, 
      {
        "DetailType": "SubTotalLineDetail", 
        "Amount": 35.0, 
        "SubTotalLineDetail": {}
      }, 
      {
        "DetailType": "DiscountLineDetail", 
        "Amount": 3.5, 
        "DiscountLineDetail": {
          "DiscountAccountRef": {
            "name": "Discounts given", 
            "value": "86"
          }, 
          "PercentBased": true, 
          "DiscountPercent": 10
        }
      }
    ], 
    "ApplyTaxAfterDiscount": false, 
    "CustomField": [
      {
        "DefinitionId": "1", 
        "Type": "StringType", 
        "Name": "Crew #"
      }
    ], 
    "Id": "177", 
    "TxnTaxDetail": {
      "TotalTax": 0
    }, 
    "MetaData": {
      "CreateTime": "2015-03-26T13:25:05-07:00", 
      "LastUpdatedTime": "2015-03-26T13:25:05-07:00"
    }
  }, 
  "time": "2015-03-26T13:25:05.473-07:00"
}
 */
const get_order = async (order_id) => {
  let TokenInfo = getRefreshToken()
  let access_token = await authenticate(TokenInfo);

  access_token.getPurchaseOrder(order_id, (err, order_details) => {
    if (err) throw err
    else return order_details;
  })
}
/**
 * 
 * @param Line  {The minimum line item required for the request is one of the following. Sales item line type Group item line type}
 * @param CustomerRef {Reference to a customer or job. Query the Customer name list resource to determine the appropriate Customer object for this reference. Use Customer.Id and Customer.DisplayName from that object for CustomerRef.value and CustomerRef.name, respectively.}  
 * @param CurrencyRef {Reference to the currency in which all amounts on the associated transaction are expressed. This must be defined if multicurrency is enabled for the company.
Multicurrency is enabled for the company if Preferences.MultiCurrencyEnabled is set to true. Read more about multicurrency support here. Required if multicurrency is enabled for the company} 
* 
* @param SampleForResponse
*
*{
  "Estimate": {
    "DocNumber": "1001", 
    "SyncToken": "0", 
    "domain": "QBO", 
    "TxnStatus": "Pending", 
    "BillEmail": {
      "Address": "Cool_Cars@intuit.com"
    }, 
    "TxnDate": "2015-03-26", 
    "TotalAmt": 31.5, 
    "CustomerRef": {
      "name": "Cool Cars", 
      "value": "3"
    }, 
    "CustomerMemo": {
      "value": "Thank you for your business and have a great day!"
    }, 
    "ShipAddr": {
      "CountrySubDivisionCode": "CA", 
      "City": "Half Moon Bay", 
      "PostalCode": "94213", 
      "Id": "104", 
      "Line1": "65 Ocean Dr."
    }, 
    "PrintStatus": "NeedToPrint", 
    "BillAddr": {
      "CountrySubDivisionCode": "CA", 
      "City": "Half Moon Bay", 
      "PostalCode": "94213", 
      "Id": "103", 
      "Line1": "65 Ocean Dr."
    }, 
    "sparse": false, 
    "EmailStatus": "NotSet", 
    "Line": [
      {
        "Description": "Pest Control Services", 
        "DetailType": "SalesItemLineDetail", 
        "SalesItemLineDetail": {
          "TaxCodeRef": {
            "value": "NON"
          }, 
          "Qty": 1, 
          "UnitPrice": 35, 
          "ItemRef": {
            "name": "Pest Control", 
            "value": "10"
          }
        }, 
        "LineNum": 1, 
        "Amount": 35.0, 
        "Id": "1"
      }, 
      {
        "DetailType": "SubTotalLineDetail", 
        "Amount": 35.0, 
        "SubTotalLineDetail": {}
      }, 
      {
        "DetailType": "DiscountLineDetail", 
        "Amount": 3.5, 
        "DiscountLineDetail": {
          "DiscountAccountRef": {
            "name": "Discounts given", 
            "value": "86"
          }, 
          "PercentBased": true, 
          "DiscountPercent": 10
        }
      }
    ], 
    "ApplyTaxAfterDiscount": false, 
    "CustomField": [
      {
        "DefinitionId": "1", 
        "Type": "StringType", 
        "Name": "Crew #"
      }
    ], 
    "Id": "177", 
    "TxnTaxDetail": {
      "TotalTax": 0
    }, 
    "MetaData": {
      "CreateTime": "2015-03-26T13:25:05-07:00", 
      "LastUpdatedTime": "2015-03-26T13:25:05-07:00"
    }
  }, 
  "time": "2015-03-26T13:25:05.473-07:00"
}
 */
const create_order = async (Line, CustomerRef, CurrencyRef) => {
  let TokenInfo = getRefreshToken()
  let access_token = await authenticate(TokenInfo);
  let info = {
    Line: Line,
    CustomerRef: CustomerRef,
    CurrencyRef: CurrencyRef
  }
  access_token.createPurchaseOrder(info, (err, order_details) => {
    if (err) throw err
    else return order_details
  })
}

/**
 * 
 * @param order_id  {Unique identifier for this object. Sort order is ASC by default.
}
 * @param CustomerRef {Reference to a customer or job. Query the Customer name list resource to determine the appropriate Customer object for this reference. Use Customer.Id and Customer.DisplayName from that object for CustomerRef.value and CustomerRef.name, respectively.}  
 * @param SyncToken  {Version number of the object. It is used to lock an object for use by one app at a time. As soon as an application modifies an object, its SyncToken is incremented. Attempts to modify an object specifying an older SyncToken fails. Only the latest version of the object is maintained by QuickBooks Online.}
 * @param CurrencyRef {Reference to the currency in which all amounts on the associated transaction are expressed. This must be defined if multicurrency is enabled for the company. Multicurrency is enabled for the company if Preferences.MultiCurrencyEnabled is set to true. Read more about multicurrency support here. Required if multicurrency is enabled for the company.} 
 * @param BillEmail {Identifies the e-mail address where the estimate is sent. If EmailStatus=NeedToSend, BillEmailis a required input.}
 * 
 * @param SampleForResponse
 * 
 *  {
  "Estimate": {
    "DocNumber": "1001", 
    "SyncToken": "3", 
    "domain": "QBO", 
    "TxnStatus": "Closed", 
    "BillEmail": {
      "Address": "Geeta@Kalapatapu.com"
    }, 
    "TxnDate": "2014-09-07", 
    "TotalAmt": 582.5, 
    "CustomerRef": {
      "name": "Geeta Kalapatapu", 
      "value": "10"
    }, 
    "CustomerMemo": {
      "value": "An updated memo via full update."
    }, 
    "ShipAddr": {
      "CountrySubDivisionCode": "CA", 
      "City": "Middlefield", 
      "PostalCode": "94303", 
      "Id": "119", 
      "Line1": "1987 Main St."
    }, 
    "LinkedTxn": [
      {
        "TxnId": "103", 
        "TxnType": "Invoice"
      }
    ], 
    "PrintStatus": "NeedToPrint", 
    "BillAddr": {
      "Line3": "Middlefield, CA  94303", 
      "Id": "59", 
      "Line1": "Geeta Kalapatapu", 
      "Line2": "1987 Main St."
    }, 
    "sparse": false, 
    "EmailStatus": "NotSet", 
    "Line": [
      {
        "Description": "Rock Fountain", 
        "DetailType": "SalesItemLineDetail", 
        "SalesItemLineDetail": {
          "TaxCodeRef": {
            "value": "NON"
          }, 
          "Qty": 1, 
          "UnitPrice": 275, 
          "ItemRef": {
            "name": "Rock Fountain", 
            "value": "5"
          }
        }, 
        "LineNum": 1, 
        "Amount": 275.0, 
        "Id": "1"
      }, 
      {
        "Description": "Custom Design", 
        "DetailType": "SalesItemLineDetail", 
        "SalesItemLineDetail": {
          "TaxCodeRef": {
            "value": "NON"
          }, 
          "Qty": 3.5, 
          "UnitPrice": 75, 
          "ItemRef": {
            "name": "Design", 
            "value": "4"
          }
        }, 
        "LineNum": 2, 
        "Amount": 262.5, 
        "Id": "2"
      }, 
      {
        "Description": "Fountain Pump", 
        "DetailType": "SalesItemLineDetail", 
        "SalesItemLineDetail": {
          "TaxCodeRef": {
            "value": "NON"
          }, 
          "Qty": 2, 
          "UnitPrice": 22.5, 
          "ItemRef": {
            "name": "Pump", 
            "value": "11"
          }
        }, 
        "LineNum": 3, 
        "Amount": 45.0, 
        "Id": "3"
      }, 
      {
        "DetailType": "SubTotalLineDetail", 
        "Amount": 582.5, 
        "SubTotalLineDetail": {}
      }
    ], 
    "ApplyTaxAfterDiscount": false, 
    "CustomField": [
      {
        "DefinitionId": "1", 
        "Type": "StringType", 
        "Name": "Crew #"
      }
    ], 
    "Id": "41", 
    "TxnTaxDetail": {
      "TotalTax": 0
    }, 
    "MetaData": {
      "CreateTime": "2014-09-17T11:20:06-07:00", 
      "LastUpdatedTime": "2015-07-24T14:15:10-07:00"
    }
  }, 
  "time": "2015-07-24T14:15:10.332-07:00"
}
 */
const update_order = async (order_id, CustomerRef, SyncToken, CurrencyRef, BillEmail) => {
  let TokenInfo = getRefreshToken()
  let access_token = await authenticate(TokenInfo);
  let info = {
    order_id: order_id,
    CustomerRef: CustomerRef,
    SyncToken: SyncToken,
    CurrencyRef: CurrencyRef,
    BillEmail: BillEmail
  }
  access_token.updatePurchaseOrder(info, (err, order_details) => {
    if (err) throw err
    else return order_details
  })
}

/**
 * 
 * @param order_id {the id for the order that you wanna to delete it}  
 * 
 * @param SampleForResponse
 * 
 * {
  "Estimate": {
    "status": "Deleted", 
    "domain": "QBO", 
    "Id": "96"
  }, 
  "time": "2013-03-14T15:05:14.981-07:00"
}
 */
const delete_order = async (order_id) => {
  let TokenInfo = getRefreshToken()
  let access_token = await authenticate(TokenInfo);

  access_token.deletePurchaseOrder(order_id, (err, order_details) => {
    if (err) throw err
    else return order_details
  })
}

const authenticate = (data) => {
  
  let access_token = new QuickBooks(config.key,
    config.secret,
    data.access_token,
    false, /* no token secret for oAuth 2.0 */
    config.realmId,
    true, /* use a sandbox account */
    true, /* turn debugging on */
    4, /* minor version */
    '2.0', /* oauth version */
    data.refresh_token
  );

  return access_token;
}