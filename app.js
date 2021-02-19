'use strict';
require('dotenv').config()
const
    port = process.env.PORT || 3000,
    request = require('request'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    cookieSession = require('cookie-session'),
    express = require('express'),
    app = express(),
    QuickBooks = require('../index'),
    Tokens = require('csrf'),
    csrf = new Tokens(),
    axios = require('axios'),
    createAuthRefreshInterceptor = require('axios-auth-refresh');
QuickBooks.setOauthVersion('2.0');

// Generic Express config
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser('brad'));
app.use(cookieSession({name : 'session' , keys : ['key1']}))

app.listen(port, function () {
  console.log(`Express server listening on port ${port}`);
});

const config = {
key : process.env.KEY,
secret : process.env.SECRET
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
 */
const get_account = async (account_id) => {
  let access_token = await authenticate(/** needed data => req.session.qbo */);
  access_token.getAccount(account_id , (err , account_details)=>{
    if (err) throw err
    else return account_details;
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
 */
const create_account = async (Name , AcctNum , TaxCodeRef , AccountType , AccountSubType) => {
  let access_token = await authenticate(/** needed data => req.session.qbo */);
    let info = {
    Name : Name,
    AcctNum : AcctNum,
    TaxCodeRef : TaxCodeRef,
    AccountType : AccountType,
    AccountSubType : AccountSubType
  }
  access_token.createAccount(info , (err , account_details)=>{
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
 */
const update_account = async (account_id, Name , SyncToken , AcctNum)=>{
  let access_token = await authenticate(/** needed data => req.session.qbo */);
  let info = {
    Name : Name,
    AcctNum : AcctNum,
    SyncToken : SyncToken,
    account_id : account_id
  }
  access_token.updateAccount(info , (err , account_details)=>{
    if (err) throw err
    else return account_details
  })
}

/**
 * 
 * @param bill_id {the id for the Bill which you want}  
 */
const get_bill = async (bill_id) => {
  let access_token = await authenticate(/** needed data => req.session.qbo */);
  access_token.getBill(bill_id , (err , bill_details)=>{
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
 */
const create_bill = async (VendorRef , Line , CurrencyRef) => {
  let access_token = await authenticate(/** needed data => req.session.qbo */);
  let info = {
    VendorRef : VendorRef,
    Line : Line,
    CurrencyRef : CurrencyRef
  }
  access_token.createBill(info , (err , bill_details)=>{
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
 */
const update_bill = async (bill_id, VendorRef , Line , SyncToken , CurrencyRef) => {
  let access_token = await authenticate(/** needed data => req.session.qbo */);

  let info = {
    bill_id : bill_id,
    VendorRef : VendorRef,
    SyncToken : SyncToken,
    Line : Line,
    CurrencyRef : CurrencyRef
  }
  access_token.updateBill(info , (err , bill_details)=>{
    if (err) throw err
    else return bill_details
  })
}

/**
 * 
 * @param customer_id {the id for the customer that you wanted} 
 */
const get_customer = async (customer_id) => {
  let access_token = await authenticate(/** needed data => req.session.qbo */);

  access_token.getCustomer(customer_id , (err , customer_details)=>{
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
 */
const create_customer = async (DisplayName , Suffix , Title , MiddleName , FamilyName , GivenName) => {
  let access_token = await authenticate(/** needed data => req.session.qbo */);
  let info = {
    DisplayName : DisplayName,
    Suffix : Suffix,
    Title : Title,
    MiddleName : MiddleName,
    FamilyName : FamilyName,
    GivenName : GivenName
  }
  access_token.createCustomer(info , (err , customer_details)=>{
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
 */
const update_customer = async (customer_id, SyncToken , DisplayName , Suffix , Title , MiddleName , FamilyName , GivenName) => {
  let access_token = await authenticate(/** needed data => req.session.qbo */);

  let info = {
    customer_id : customer_id,
    DisplayName : DisplayName,
    SyncToken : SyncToken,
    Suffix : Suffix,
    Title : Title,
    MiddleName : MiddleName,
    FamilyName : FamilyName,
    GivenName : GivenName
  }
  access_token.updateCustomer(info , (err , customer_details)=>{
    if (err) throw err
    else return customer_details
  })
}
/**
 * 
 * @param order_id {the id for the order that you wanted}  
 */
const get_order = async (order_id) => {
  let access_token = await authenticate(/** needed data => req.session.qbo */);

  access_token.getPurchaseOrder(order_id , (err , order_details)=>{
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
 */
const create_order = async (Line , CustomerRef , CurrencyRef) => {
  let access_token = await authenticate(/** needed data => req.session.qbo */);
  let info = {
    Line : Line,
    CustomerRef : CustomerRef,
    CurrencyRef : CurrencyRef
  }
  access_token.createPurchaseOrder(info , (err , order_details)=>{
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
 */
const update_order = async (order_id, CustomerRef , SyncToken , CurrencyRef , BillEmail) => {
  let access_token = await authenticate(/** needed data => req.session.qbo */);
  let info = {
    order_id : order_id,
    CustomerRef : CustomerRef,
    SyncToken : SyncToken,
    CurrencyRef : CurrencyRef,
    BillEmail : BillEmail
  }
  access_token.updatePurchaseOrder(info , (err , order_details)=>{
    if (err) throw err
    else return order_details
  })
}

/**
 * 
 * @param {the id for the order that you wanna to delete it} order_id 
 */
const delete_order = async (order_id) => {
  let access_token = await authenticate(/** needed data => req.session.qbo */);

  access_token.deletePurchaseOrder(order_id , (err , order_details)=>{
    if (err) throw err
    else return order_details
  })
}



// OAUTH 2 makes use of redirect requests
function generateAntiForgery (session) {
  session.secret = csrf.secretSync();
  return csrf.create(session.secret);
};

app.get('/requestToken', function (req, res) {
  var redirecturl = QuickBooks.AUTHORIZATION_URL +
    '?client_id=' + config.key +
    '&redirect_uri=' + encodeURIComponent('http://localhost:' + port + '/callback/') +  //Make sure this path matches entry in application dashboard
    '&scope=com.intuit.quickbooks.accounting' +
    '&response_type=code' +
    '&state=' + generateAntiForgery(req.session);

  res.redirect(redirecturl);
});

app.get('/callback', async function (req, res) {
  var auth = (new Buffer(config.key + ':' + config.secret).toString('base64'));

  var postBody = {
    url: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + auth,
    },
    form: {
      grant_type: 'authorization_code',
      code: req.query.code,
      redirect_uri: 'http://localhost:' + port + '/callback/'  //Make sure this path matches entry in application dashboard
    }
  };

  request.post(postBody, async function (e, r, data) {
    var accessToken = JSON.parse(r.body);
    req.session.qbo = {
      token : accessToken.access_token,
      realmId : req.query.realmId,
      refresh : accessToken.refresh_token
    }

  let qbo = authenticate(req.session.qbo)
  qbo.findAccounts(function (_, accounts) {
    accounts.QueryResponse.Account.forEach(function (account) {
      console.log(account.Name);
    });
  });
});
});
  // Instantiate the interceptor (you can chain it as it returns the axios instance)
  // createAuthRefreshInterceptor()
  
  // Make a call. If it returns a 401 error, the refreshAuthLogic will be run, 
  // and the request retried with the new token
  // axios.get('https://www.example.com/restricted/area')
  //     .then(/* ... */)
  //     .catch(/* ... */);

  // });

// });

const authenticate = (data) => {

  let access_token =  new QuickBooks(config.key,
              config.secret,
              data.token, 
              false, /* no token secret for oAuth 2.0 */
              data.realmId,
               true, /* use a sandbox account */
               true, /* turn debugging on */
               4, /* minor version */
               '2.0', /* oauth version */
               data.refresh
               );
 
   return access_token;
 }