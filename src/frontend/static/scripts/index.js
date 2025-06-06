/*
 * Copyright 2023 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
 
document.addEventListener("DOMContentLoaded", function(event) {
  // Deposit modal client-side validation
  var depositForm = document.querySelector("#deposit-form");
  depositForm.addEventListener("submit", function(e) {
    var isNewAcct = (document.querySelector("#accounts").value == "add");
    document.querySelector("#external_account_num").required = isNewAcct;
    document.querySelector("#external_routing_num").required = isNewAcct;

    if(!depositForm.checkValidity() || document.querySelector("#deposit-amount").value <= 0.00){
      e.preventDefault();
      e.stopPropagation();
    }
    depositForm.classList.add("was-validated");
  });

  // Reset form on cancel event
  document.querySelectorAll(".deposit-cancel").forEach((depositCancel) => {
    depositCancel.addEventListener("click", function () {
      depositForm.reset();
      depositForm.classList.remove("was-validated");
      RefreshModals();
    });
  });

  // Send payment modal client-side validation
  var paymentForm = document.querySelector("#payment-form");
  paymentForm.addEventListener("submit", function(e) {
    // Check if account number is required
    document.querySelector("#contact_account_num").required = (document.querySelector("#payment-accounts").value == "add");

    if(!paymentForm.checkValidity() || document.querySelector("#payment-amount").value <= 0.00){
      e.preventDefault();
      e.stopPropagation();
    }
    paymentForm.classList.add("was-validated");
  });

  // Reset form on cancel event
  document.querySelectorAll(".payment-cancel").forEach((paymentCancel) => {
    paymentCancel.addEventListener("click", function () {
      paymentForm.reset();
      paymentForm.classList.remove("was-validated");
      RefreshModals();
    });
  });

  // Handle new account option in Send Payment modal
  document.querySelector("#payment-accounts").addEventListener("change", function(e) {
    RefreshModals();
  });

  // Handle new account option in Deposit modal
  document.querySelector("#accounts").addEventListener("change", function(e) {
    RefreshModals();
  });


  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };


  // Reset Modals to proper state
  function RefreshModals(){
      paymentSelection = document.querySelector("#payment-accounts").value;
      if (paymentSelection == "add") {
        document.querySelector("#otherAccountInputs").classList.remove("hidden");
      } else {
        document.querySelector("#otherAccountInputs").classList.add("hidden");
      }
      depositSelection = document.querySelector("#accounts").value;
      if (depositSelection == "add") {
        document.querySelector("#otherDepositInputs").classList.remove("hidden");
      } else {
        document.querySelector("#otherDepositInputs").classList.add("hidden");
      }
      // generate new uuids
      document.querySelector("#payment-uuid").value = uuidv4();
      document.querySelector("#deposit-uuid").value = uuidv4();
  }
  RefreshModals();
});

// Function to get the latest transaction from the table
function getLatestTransaction() {
  const transactionList = document.querySelector('#transaction-list');
  if (!transactionList || !transactionList.firstElementChild) return null;
  
  const firstRow = transactionList.firstElementChild;
  const data = {
    amount: firstRow.querySelector('.transaction-amount').textContent.replace(/[+\-]/g, '').trim(),
    date: firstRow.querySelector('.transaction-date p').textContent.trim(),
    type: firstRow.querySelector('.transaction-type').textContent.includes('Debit') ? 'debit' : 'credit',
    account: firstRow.querySelector('.transaction-account').textContent.trim(),
    label: firstRow.querySelector('.transaction-label').textContent.trim(),
    transactionId: Math.floor(100000 + Math.random() * 900000).toString()
  };
  return data;
}

// Function to send receipt data and trigger download
async function handleReceiptDownload(transactionData) {
  try {
    const response = await fetch('https://pdfgen-766109226341.us-central1.run.app/receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transactionData)
    });

    if (!response.ok) throw new Error('Receipt generation failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${transactionData.transactionId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  } catch (error) {
    console.error('Error generating receipt:', error);
  }
}

// Add success message observer
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      const alertMessage = document.querySelector('#alert-message');
      if (alertMessage && alertMessage.textContent.includes('Payment successful')) {
        setTimeout(() => {
          const transactionData = getLatestTransaction();
          if (transactionData) {
            handleReceiptDownload(transactionData);
          }
        }, 1000); // Wait for transaction table to update
      }
    }
  });
});

// Start observing the document for success message
document.addEventListener('DOMContentLoaded', function() {
  const targetNode = document.body;
  observer.observe(targetNode, { childList: true, subtree: true });
  // generate new uuids
  document.querySelector("#payment-uuid").value = uuidv4();
  document.querySelector("#deposit-uuid").value = uuidv4();
});
