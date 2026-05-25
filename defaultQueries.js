window.DEFAULT_QUERY_LIBRARY = [
  {
    id: "default-cpq-quote-by-number",
    title: "Quote by Quote Number",
    category: "CPQ",
    description: "Pull the core quote record and owner details for a known quote number.",
    query: "SELECT Id, Name, SBQQ__Status__c, SBQQ__Opportunity2__c, SBQQ__PrimaryQuote__c, Owner.Name, CreatedDate, LastModifiedDate FROM SBQQ__Quote__c WHERE Name = '{{quoteNumber}}' ORDER BY LastModifiedDate DESC",
    isDefault: true
  },
  {
    id: "default-cpq-quote-lines",
    title: "Quote Lines by Quote Id",
    category: "CPQ",
    description: "Inspect quote line pricing, product, and subscription fields.",
    query: "SELECT Id, Name, SBQQ__ProductName__c, SBQQ__ProductCode__c, SBQQ__Quantity__c, SBQQ__NetPrice__c, SBQQ__SubscriptionType__c FROM SBQQ__QuoteLine__c WHERE SBQQ__Quote__c = '{{recordId}}' ORDER BY CreatedDate ASC",
    isDefault: true
  },
  {
    id: "default-aa-approval-records",
    title: "Approval Chain by Record Id",
    category: "Advanced Approvals",
    description: "Review Advanced Approvals records tied to a quote or related record.",
    query: "SELECT Id, Name, sbaa__ApprovalStatus__c, sbaa__Approver__r.Name, sbaa__Rule__r.Name, CreatedDate, LastModifiedDate FROM sbaa__Approval__c WHERE sbaa__ApprovalRequest__c = '{{recordId}}' ORDER BY CreatedDate DESC",
    isDefault: true
  },
  {
    id: "default-aa-history",
    title: "Approval History by Related Record",
    category: "Advanced Approvals",
    description: "Show approval history events for a record under review.",
    query: "SELECT Id, Name, sbaa__Action__c, sbaa__Comments__c, CreatedBy.Name, CreatedDate FROM sbaa__ApprovalHistory__c WHERE sbaa__RelatedObjectId__c = '{{recordId}}' ORDER BY CreatedDate DESC",
    isDefault: true
  },
  {
    id: "default-admin-user-email",
    title: "User by Email",
    category: "Admin",
    description: "Find an active user and profile details by email address.",
    query: "SELECT Id, Name, Username, Email, IsActive, Profile.Name, UserRole.Name, LastLoginDate FROM User WHERE Email = '{{userEmail}}' LIMIT 25",
    isDefault: true
  },
  {
    id: "default-admin-permission-sets",
    title: "Permission Sets for User",
    category: "Admin",
    description: "List permission set assignments for a given user.",
    query: "SELECT Id, Assignee.Name, Assignee.Email, PermissionSet.Name, PermissionSet.Label, PermissionSet.NamespacePrefix FROM PermissionSetAssignment WHERE AssigneeId = '{{recordId}}' ORDER BY PermissionSet.Label ASC",
    isDefault: true
  },
  {
    id: "default-products-by-code",
    title: "Products by Product Code",
    category: "Products",
    description: "Inspect product details, lifecycle state, and family.",
    query: "SELECT Id, Name, ProductCode, Family, IsActive, Description, LastModifiedDate FROM Product2 WHERE ProductCode = '{{productCode}}' ORDER BY LastModifiedDate DESC",
    isDefault: true
  },
  {
    id: "default-products-pricebook-entry",
    title: "Pricebook Entries by Product",
    category: "Products",
    description: "Review pricebook entries associated with a product.",
    query: "SELECT Id, Product2.Name, Product2.ProductCode, Pricebook2.Name, UnitPrice, IsActive, UseStandardPrice FROM PricebookEntry WHERE Product2Id = '{{recordId}}' ORDER BY Pricebook2.Name ASC",
    isDefault: true
  },
  {
    id: "default-rca-orders-by-opportunity",
    title: "Orders by Opportunity",
    category: "RCA / Revenue Cloud",
    description: "Pull order records created from a specific opportunity.",
    query: "SELECT Id, OrderNumber, Status, EffectiveDate, Account.Name, Owner.Name, TotalAmount FROM Order WHERE OpportunityId = '{{opportunityId}}' ORDER BY CreatedDate DESC",
    isDefault: true
  },
  {
    id: "default-rca-assets-by-record",
    title: "Assets by Related Record",
    category: "RCA / Revenue Cloud",
    description: "Inspect asset details connected to a contract, quote, or order.",
    query: "SELECT Id, Name, Product2.Name, Product2.ProductCode, Status, Quantity, InstallDate, CreatedDate FROM Asset WHERE AccountId = '{{recordId}}' ORDER BY CreatedDate DESC",
    isDefault: true
  },
  {
    id: "default-debug-apex-jobs",
    title: "Recent Apex Jobs",
    category: "Debug",
    description: "See recent asynchronous Apex jobs and outcomes.",
    query: "SELECT Id, JobType, ApexClass.Name, Status, ExtendedStatus, CreatedBy.Name, CreatedDate, CompletedDate FROM AsyncApexJob ORDER BY CreatedDate DESC LIMIT 50",
    isDefault: true
  },
  {
    id: "default-debug-apex-logs",
    title: "Debug Logs by User",
    category: "Debug",
    description: "Review recent Apex logs for a specific user.",
    query: "SELECT Id, LogUser.Name, Application, Status, Operation, DurationMilliseconds, StartTime, LogLength FROM ApexLog WHERE LogUser.Email = '{{userEmail}}' ORDER BY StartTime DESC LIMIT 25",
    isDefault: true
  }
];