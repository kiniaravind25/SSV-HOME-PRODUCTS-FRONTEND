document.addEventListener("DOMContentLoaded", () => {
    const shopDetailsPage = document.getElementById("shopDetailsPage");
    const orderManagementPage = document.getElementById("orderManagementPage");
    const customerNameInput = document.getElementById("customerName");
    const enterCustomerButton = document.getElementById("enterCustomerButton");

    const customerInfoSection = document.getElementById("customerInfoSection");
    const loadOrderHistoryButton = document.getElementById("loadOrderHistoryButton");
    const getItemsButton = document.getElementById("getItemsButton");
    const availableItemsSection = document.getElementById("availableItemsSection");
    const placeOrderButton = document.getElementById("placeOrderButton");
    const orderSummary = document.getElementById("orderSummary");
    const amountPaidInput = document.getElementById("amountPaid");
    const orderTotal = document.getElementById("orderTotal");
    const orderHistorySection = document.getElementById("orderHistorySection");
    const customerOldBalance = document.getElementById("customerOldBalance");

    let currentCustomer = null;
    let selectedItems = [];

    // Page transition to Order Management page
    enterCustomerButton.addEventListener("click", () => {
        const customerName = customerNameInput.value.trim();
        if (!customerName) {
            alert("Please enter a customer name.");
            return;
        }

        // Fetch customer details from backend
        fetch(`http://localhost:8080/customer/${customerName}`)
            .then(response => response.json())
            .then(customer => {
                if (customer) {
                    currentCustomer = customer;
                    displayCustomerInfo(customer);
                    shopDetailsPage.classList.add("hidden");
                    orderManagementPage.classList.remove("hidden");
                } else {
                    alert("Customer not found.");
                }
            })
            .catch(error => console.error("Error fetching customer details:", error));
    });

    // Display customer info (Old Balance)
    function displayCustomerInfo(customer) {
        customerOldBalance.textContent = `Old Balance: ₹${customer.oldBalance}`;
    }

    // Show Order History
    loadOrderHistoryButton.addEventListener("click", () => {
        loadOrderHistory(currentCustomer.name, 10); // Fetch last 10 days' orders
    });

    // Get Available Items
    getItemsButton.addEventListener("click", () => {
        loadAvailableItems();
    });

    // Load available items from the backend
    function loadAvailableItems() {
        fetch("http://localhost:8080/items")
            .then(response => response.json())
            .then(items => {
                availableItemsSection.classList.remove("hidden");
                availableItemsSection.innerHTML = items.map(item => `
                    <div class="item">
                        <label>${item.name} (Price: ₹${item.price})</label>
                        <input type="number" min="1" id="quantity-${item.id}">
                        <button onclick="addItem(${item.id}, '${item.name}', ${item.price})">Add</button>
                    </div>
                `).join("");
            })
            .catch(error => console.error("Error fetching items:", error));
    }

    // Add selected item to order summary
    window.addItem = (itemId, itemName, itemPrice) => {
        const quantity = document.getElementById(`quantity-${itemId}`).value;
        if (!quantity || quantity <= 0) {
            alert("Please enter a valid quantity.");
            return;
        }

        selectedItems.push({ itemId, itemName, itemPrice, quantity });
        updateOrderSummary();
    };

    // Update order summary and calculate total price
    function updateOrderSummary() {
        let total = 0;
        orderSummarySection.classList.remove("hidden");
        orderSummary.innerHTML = selectedItems.map(item => {
            const itemTotal = item.quantity * item.itemPrice;
            total += itemTotal;
            return `<p>${item.itemName} -> ${item.quantity} x ₹${item.itemPrice} = ₹${itemTotal}</p>`;
        }).join("");
        orderTotal.textContent = `Total: ₹${total}`;
    }

    // Place the order
    placeOrderButton.addEventListener("click", () => {
        const amountPaid = parseFloat(amountPaidInput.value);
        if (isNaN(amountPaid) || amountPaid <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        const orderItems = selectedItems.map(item => ({
            itemId: item.itemId,
            quantity: item.quantity
        }));

        const orderData = {
            customerName: currentCustomer.name,
            itemsRequest: orderItems,
            amountPaid: amountPaid
        };

        fetch("http://localhost:8080/order/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(orderData)
        })
            .then(response => response.json())
            .then(order => {
                alert("Order placed successfully!");
                selectedItems = [];
                updateOrderSummary(); // Clear order summary
                amountPaidInput.value = ""; // Clear amount paid
                loadOrderHistory(currentCustomer.name, 10); // Refresh order history
            })
            .catch(error => console.error("Error placing order:", error));
    });

    // Load order history
    function loadOrderHistory(customerName, days) {
        fetch(`http://localhost:8080/order/history/${customerName}/${days}`)
            .then(response => response.json())
            .then(orders => {
                orderHistorySection.classList.remove("hidden");
                orderHistorySection.innerHTML = orders.map(order => `
                    <div class="order-history-item">
                        <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleDateString()}</p>
                        <p><strong>Items:</strong> ${order.items.map(item => `${item.itemName} - ${item.quantity} x ₹${item.itemPrice}`).join(", ")}</p>
                        <p><strong>Total Price:</strong> ₹${order.totalPrice}</p>
                    </div>
                `).join("");
            })
            .catch(error => console.error("Error fetching order history:", error));
    }
});
