import { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import {
  FaUtensils,
  FaPlane,
  FaGamepad,
  FaTimes,
  FaRupeeSign,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

import "./App.css";

const INITIAL_BALANCE = 5000;

const CATEGORIES = [
  "Food",
  "Entertainment",
  "Travel",
];

const CATEGORY_COLORS = {
  Food: "#9b00ff",
  Entertainment: "#ff9800",
  Travel: "#ffd600",
};

const STORAGE_KEYS = {
  balance: "balance",
  expenses: "expenses",
};

function App() {
  // ================================
  // BALANCE
  // ================================

  const [balance, setBalance] = useState(() => {
    const savedBalance = localStorage.getItem(
      STORAGE_KEYS.balance
    );

    if (savedBalance === null) {
      return INITIAL_BALANCE;
    }

    const parsedBalance = Number(savedBalance);

    return Number.isFinite(parsedBalance)
      ? parsedBalance
      : INITIAL_BALANCE;
  });

  // ================================
  // EXPENSES
  // ================================

  const [expenses, setExpenses] = useState(() => {
    const savedExpenses = localStorage.getItem(
      STORAGE_KEYS.expenses
    );

    if (!savedExpenses) {
      return [];
    }

    try {
      const parsedExpenses =
        JSON.parse(savedExpenses);

      return Array.isArray(parsedExpenses)
        ? parsedExpenses
        : [];
    } catch {
      return [];
    }
  });

  const [modalType, setModalType] = useState(null);
  const [editingExpense, setEditingExpense] =
    useState(null);

  // ================================
  // LOCAL STORAGE
  // ================================

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.balance,
      String(balance)
    );
  }, [balance]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.expenses,
      JSON.stringify(expenses)
    );
  }, [expenses]);

  // ================================
  // TOTAL EXPENSE
  // ================================

  const totalExpenses = useMemo(() => {
    return expenses.reduce(
      (total, expense) =>
        total + Number(expense.amount),
      0
    );
  }, [expenses]);

  // ================================
  // PIE CHART DATA
  // ================================

  const pieData = useMemo(() => {
    return CATEGORIES.map((category) => {
      const total = expenses
        .filter(
          (expense) =>
            expense.category === category
        )
        .reduce(
          (sum, expense) =>
            sum + Number(expense.amount),
          0
        );

      return {
        name: category,
        value: total,
      };
    }).filter((item) => item.value > 0);
  }, [expenses]);

  // ================================
  // BAR CHART DATA
  // ================================

  const barData = useMemo(() => {
    return CATEGORIES.map((category) => {
      const total = expenses
        .filter(
          (expense) =>
            expense.category === category
        )
        .reduce(
          (sum, expense) =>
            sum + Number(expense.amount),
          0
        );

      return {
        category,
        amount: total,
      };
    });
  }, [expenses]);

  // ================================
  // MODALS
  // ================================

  const openAddBalanceModal = () => {
    setModalType("balance");
  };

  const openAddExpenseModal = () => {
    setEditingExpense(null);
    setModalType("expense");
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setModalType("expense");
  };

  const closeModal = () => {
    setModalType(null);
    setEditingExpense(null);
  };

  // ================================
  // ADD BALANCE
  // ================================

  const handleAddBalance = (amount) => {
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setBalance(
      (currentBalance) =>
        currentBalance + numericAmount
    );

    closeModal();
  };

  // ================================
  // ADD / EDIT EXPENSE
  // ================================

  const handleExpenseSubmit = (formData) => {
    const title = formData.title.trim();

    // IMPORTANT:
    // Cypress expects name="price"
    const amount = Number(formData.price);

    const category = formData.category;
    const date = formData.date;

    // ----------------------------
    // VALIDATION
    // ----------------------------

    if (!title) {
      alert("Please enter expense title.");
      return;
    }

    if (!amount || amount <= 0) {
      alert("Please enter a valid expense amount.");
      return;
    }

    if (!category) {
      alert("Please select a category.");
      return;
    }

    if (!date) {
      alert("Please select a date.");
      return;
    }

    // ================================
    // ADD NEW EXPENSE
    // ================================

    if (!editingExpense) {
      if (amount > balance) {
        alert(
          "You cannot spend more than your available wallet balance."
        );
        return;
      }

      const newExpense = {
        id: Date.now(),
        title,
        amount,
        category,
        date,
      };

      setExpenses((currentExpenses) => [
        newExpense,
        ...currentExpenses,
      ]);

      setBalance(
        (currentBalance) =>
          currentBalance - amount
      );

      closeModal();

      return;
    }

    // ================================
    // EDIT EXISTING EXPENSE
    // ================================

    const oldAmount = Number(
      editingExpense.amount
    );

    // Return old expense amount first
    const availableBalance =
      balance + oldAmount;

    if (amount > availableBalance) {
      alert(
        "You cannot set this expense because it exceeds your available wallet balance."
      );

      return;
    }

    const updatedExpense = {
      ...editingExpense,
      title,
      amount,
      category,
      date,
    };

    setExpenses((currentExpenses) =>
      currentExpenses.map((expense) =>
        expense.id === editingExpense.id
          ? updatedExpense
          : expense
      )
    );

    setBalance(
      availableBalance - amount
    );

    closeModal();
  };

  // ================================
  // DELETE EXPENSE
  // ================================

  const handleDeleteExpense = (expense) => {
    const confirmed = window.confirm(
      `Delete "${expense.title}" expense?`
    );

    if (!confirmed) {
      return;
    }

    setExpenses((currentExpenses) =>
      currentExpenses.filter(
        (item) => item.id !== expense.id
      )
    );

    // Return deleted expense money
    setBalance(
      (currentBalance) =>
        currentBalance +
        Number(expense.amount)
    );
  };

  // ================================
  // FORMAT MONEY
  // ================================

  const formatAmount = (amount) => {
    // No thousands separator: tests look for plain numbers like "7000"
    return `₹${Number(amount)}`;
  };

  // ================================
  // FORMAT DATE
  // ================================

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    const dateObject = new Date(
      `${date}T00:00:00`
    );

    return dateObject.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  };

  // ================================
  // CATEGORY ICON
  // ================================

  const getCategoryIcon = (category) => {
    if (category === "Food") {
      return <FaUtensils />;
    }

    if (category === "Travel") {
      return <FaPlane />;
    }

    return <FaGamepad />;
  };

  return (
    <div className="app">
      {/* ============================
          HEADER
      ============================ */}

      <header className="header">
        <h1>Expense Tracker</h1>
      </header>

      <main className="container">

        {/* ============================
            SUMMARY SECTION
        ============================ */}

        <section className="summary-section">

          {/* WALLET */}

          <div className="summary-card wallet-card">
            <div className="summary-content">

              <h2>
                Wallet Balance:{" "}
                <span className="wallet-value">
                  {formatAmount(balance)}
                </span>
              </h2>

              <button
                className="income-button"
                onClick={openAddBalanceModal}
              >
                + Add Income
              </button>

            </div>
          </div>

          {/* EXPENSE */}

          <div className="summary-card expense-card">
            <div className="summary-content">

              <h2>
                Expenses:{" "}
                <span className="expense-value">
                  {formatAmount(totalExpenses)}
                </span>
              </h2>

              <button
                className="expense-button"
                onClick={openAddExpenseModal}
              >
                + Add Expense
              </button>

            </div>
          </div>

          {/* PIE CHART */}

          <div className="pie-wrapper">

            {pieData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>

                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="72%"
                    labelLine={false}
                    label={({ percent }) =>
                      `${(
                        percent * 100
                      ).toFixed(0)}%`
                    }
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={
                          CATEGORY_COLORS[
                            entry.name
                          ]
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      formatAmount(value)
                    }
                  />

                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <span>No expenses yet</span>
              </div>
            )}

            <div className="chart-legend">

              {CATEGORIES.map((category) => (
                <div
                  className="legend-item"
                  key={category}
                >
                  <span
                    className="legend-color"
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[
                          category
                        ],
                    }}
                  />

                  <span>{category}</span>
                </div>
              ))}

            </div>

          </div>
        </section>

        {/* ============================
            CONTENT
        ============================ */}

        <section className="content-grid">

          {/* RECENT TRANSACTIONS */}

          <div className="transactions-section">

            <h2 className="section-title">
              Recent Transactions
            </h2>

            <div className="transactions-container">

              {expenses.length === 0 ? (
                <div className="no-transactions">
                  No transactions!
                </div>
              ) : (
                expenses.map((expense) => (
                  <div
                    className="transaction"
                    key={expense.id}
                  >

                    <div className="transaction-left">

                      <div className="category-icon">
                        {getCategoryIcon(
                          expense.category
                        )}
                      </div>

                      <div className="transaction-info">

                        <h3>
                          {expense.title}
                        </h3>

                        <p>
                          {formatDate(
                            expense.date
                          )}
                        </p>

                      </div>

                    </div>

                    <div className="transaction-right">

                      <span className="transaction-amount">
                        {formatAmount(
                          expense.amount
                        )}
                      </span>

                      <button
                        className="icon-button delete"
                        onClick={() =>
                          handleDeleteExpense(
                            expense
                          )
                        }
                        aria-label="Delete expense"
                      >
                        <FaTrash />
                      </button>

                      <button
                        className="icon-button edit"
                        onClick={() =>
                          openEditModal(expense)
                        }
                        aria-label="Edit expense"
                      >
                        <FaEdit />
                      </button>

                    </div>

                  </div>
                ))
              )}

            </div>
          </div>

          {/* TOP EXPENSES */}

          <div className="top-expenses-section">

            <h2 className="section-title">
              Top Expenses
            </h2>

            <div className="bar-chart-container">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{
                    top: 10,
                    right: 15,
                    left: 10,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    tickFormatter={(value) =>
                      `₹${value}`
                    }
                  />

                  <YAxis
                    type="category"
                    dataKey="category"
                    width={90}
                  />

                  <Tooltip
                    formatter={(value) =>
                      formatAmount(value)
                    }
                  />

                  <Bar
                    dataKey="amount"
                    fill="#7f79d9"
                    radius={[
                      0,
                      4,
                      4,
                      0,
                    ]}
                    barSize={18}
                  />

                </BarChart>
              </ResponsiveContainer>

            </div>
          </div>

        </section>
      </main>

      {/* ============================
          BALANCE MODAL
      ============================ */}

      {modalType === "balance" && (
        <ModalOverlay onClose={closeModal}>

          <BalanceForm
            onSubmit={handleAddBalance}
            onCancel={closeModal}
          />

        </ModalOverlay>
      )}

      {/* ============================
          EXPENSE MODAL
      ============================ */}

      {modalType === "expense" && (
        <ModalOverlay onClose={closeModal}>

          <ExpenseForm
            expense={editingExpense}
            onSubmit={handleExpenseSubmit}
            onCancel={closeModal}
          />

        </ModalOverlay>
      )}

    </div>
  );
}

// ======================================================
// MODAL OVERLAY
// ======================================================

function ModalOverlay({
  children,
  onClose,
}) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={onClose}
    >

      <div
        className="modal-container"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          <FaTimes />
        </button>

        {children}

      </div>

    </div>
  );
}

// ======================================================
// BALANCE FORM
// ======================================================

function BalanceForm({
  onSubmit,
  onCancel,
}) {
  const [amount, setAmount] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(amount);
  };

  return (
    <form
      className="modal-form"
      onSubmit={handleSubmit}
    >

      <h2>Add Balance</h2>

      <div className="form-group">

        <label htmlFor="incomeAmount">
          Income Amount
        </label>

        <div className="input-with-icon">

          <FaRupeeSign />

          <input
            id="incomeAmount"
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(event) =>
              setAmount(event.target.value)
            }
            placeholder="Income Amount"
            autoFocus
          />

        </div>
      </div>

      <div className="modal-actions">

        <button
          type="submit"
          className="primary-button income-submit"
        >
          Add Balance
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
        >
          Cancel
        </button>

      </div>

    </form>
  );
}

// ======================================================
// EXPENSE FORM
// ======================================================

function ExpenseForm({
  expense,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    title: expense?.title || "",

    // IMPORTANT:
    // Cypress expects name="price"
    price: expense?.amount || "",

    category: expense?.category || "",
    date: expense?.date || "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
  };

  return (
    <form
      className="modal-form"
      onSubmit={handleSubmit}
    >

      <h2>
        {expense
          ? "Edit Expense"
          : "Add Expenses"}
      </h2>

      <div className="form-grid">

        {/* TITLE */}

        <div className="form-group">

          <label htmlFor="title">
            Title
          </label>

          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            placeholder="Title"
          />

        </div>

        {/* PRICE */}

        <div className="form-group">

          <label htmlFor="price">
            Price
          </label>

          <input
            id="price"
            name="price"
            type="number"
            min="1"
            step="0.01"
            value={formData.price}
            onChange={handleChange}
            placeholder="Price"
          />

        </div>

        {/* CATEGORY */}

        <div className="form-group">

          <label htmlFor="category">
            Category
          </label>

          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
          >

            <option value="">
              Select category
            </option>

            {CATEGORIES.map((category) => (
              <option
                value={category}
                key={category}
              >
                {category}
              </option>
            ))}

          </select>

        </div>

        {/* DATE */}

        <div className="form-group">

          <label htmlFor="date">
            Date
          </label>

          <input
            id="date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
          />

        </div>

      </div>

      <div className="modal-actions">

        <button
          type="submit"
          className="primary-button expense-submit"
        >
          {expense
            ? "Update Expense"
            : "Add Expense"}
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
        >
          Cancel
        </button>

      </div>

    </form>
  );
}

export default App;