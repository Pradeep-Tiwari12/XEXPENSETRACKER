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
  FaPlus,
  FaEdit,
  FaTrash,
  FaWallet,
  FaUtensils,
  FaPlane,
  FaGamepad,
  FaTimes,
  FaRupeeSign,
} from "react-icons/fa";

import "./App.css";

const INITIAL_BALANCE = 5000;

const CATEGORIES = ["Food", "Entertainment", "Travel"];

const CATEGORY_COLORS = {
  Food: "#9b00ff",
  Entertainment: "#ff9800",
  Travel: "#ffd600",
};

const STORAGE_KEYS = {
  balance: "expenseTrackerBalance",
  expenses: "expenseTrackerExpenses",
};

function App() {
  const [balance, setBalance] = useState(() => {
    const savedBalance = localStorage.getItem(STORAGE_KEYS.balance);

    if (savedBalance === null) {
      return INITIAL_BALANCE;
    }

    const parsedBalance = Number(savedBalance);

    return Number.isFinite(parsedBalance)
      ? parsedBalance
      : INITIAL_BALANCE;
  });

  const [expenses, setExpenses] = useState(() => {
    const savedExpenses = localStorage.getItem(STORAGE_KEYS.expenses);

    if (!savedExpenses) {
      return [];
    }

    try {
      const parsedExpenses = JSON.parse(savedExpenses);
      return Array.isArray(parsedExpenses) ? parsedExpenses : [];
    } catch {
      return [];
    }
  });

  const [modalType, setModalType] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  // Persist wallet balance
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.balance, String(balance));
  }, [balance]);

  // Persist expenses
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.expenses,
      JSON.stringify(expenses)
    );
  }, [expenses]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce(
      (total, expense) => total + Number(expense.amount),
      0
    );
  }, [expenses]);

  const pieData = useMemo(() => {
    return CATEGORIES.map((category) => ({
      name: category,
      value: expenses
        .filter((expense) => expense.category === category)
        .reduce((total, expense) => total + Number(expense.amount), 0),
    })).filter((item) => item.value > 0);
  }, [expenses]);

  const barData = useMemo(() => {
    return CATEGORIES.map((category) => ({
      category,
      amount: expenses
        .filter((expense) => expense.category === category)
        .reduce((total, expense) => total + Number(expense.amount), 0),
    }));
  }, [expenses]);

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

  const handleAddBalance = (amount) => {
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setBalance((currentBalance) => currentBalance + numericAmount);

    closeModal();
  };

  const handleAddExpense = (formData) => {
    const amount = Number(formData.amount);

    if (!formData.title.trim()) {
      alert("Please enter expense title.");
      return;
    }

    if (!amount || amount <= 0) {
      alert("Please enter a valid expense amount.");
      return;
    }

    if (!formData.category) {
      alert("Please select a category.");
      return;
    }

    if (!formData.date) {
      alert("Please select a date.");
      return;
    }

    // ADD EXPENSE
    if (!editingExpense) {
      if (amount > balance) {
        alert("You cannot spend more than your available wallet balance.");
        return;
      }

      const newExpense = {
        id: Date.now(),
        title: formData.title.trim(),
        amount,
        category: formData.category,
        date: formData.date,
      };

      setExpenses((currentExpenses) => [
        newExpense,
        ...currentExpenses,
      ]);

      setBalance((currentBalance) => currentBalance - amount);

      closeModal();
      return;
    }

    // EDIT EXPENSE

    const oldAmount = Number(editingExpense.amount);

    // During edit, old expense amount becomes available again.
    const availableBalance = balance + oldAmount;

    if (amount > availableBalance) {
      alert(
        "You cannot set this expense because it exceeds your available wallet balance."
      );
      return;
    }

    const updatedExpense = {
      ...editingExpense,
      title: formData.title.trim(),
      amount,
      category: formData.category,
      date: formData.date,
    };

    setExpenses((currentExpenses) =>
      currentExpenses.map((expense) =>
        expense.id === editingExpense.id
          ? updatedExpense
          : expense
      )
    );

    setBalance(availableBalance - amount);

    closeModal();
  };

  const handleDeleteExpense = (expense) => {
    const confirmed = window.confirm(
      `Delete "${expense.title}" expense?`
    );

    if (!confirmed) {
      return;
    }

    setExpenses((currentExpenses) =>
      currentExpenses.filter((item) => item.id !== expense.id)
    );

    // Deleted expense amount comes back to wallet.
    setBalance((currentBalance) => {
      return currentBalance + Number(expense.amount);
    });
  };

  const getCategoryIcon = (category) => {
    if (category === "Food") {
      return <FaUtensils />;
    }

    if (category === "Travel") {
      return <FaPlane />;
    }

    return <FaGamepad />;
  };

  const formatAmount = (amount) => {
    return `₹${Number(amount).toLocaleString("en-IN")}`;
  };

  const formatDate = (date) => {
    if (!date) return "";

    const dateObject = new Date(`${date}T00:00:00`);

    return dateObject.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Expense Tracker</h1>
      </header>

      <main className="container">
        {/* TOP SUMMARY */}
        <section className="summary-section">
          {/* Wallet */}
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
                <FaPlus />
                Add Income
              </button>
            </div>
          </div>

          {/* Expenses */}
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
                <FaPlus />
                Add Expense
              </button>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="pie-wrapper">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="75%"
                    innerRadius="0%"
                    paddingAngle={1}
                    labelLine={false}
                    label={({ percent }) =>
                      `${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={CATEGORY_COLORS[entry.name]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) => formatAmount(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <FaWallet />
                <span>No expenses yet</span>
              </div>
            )}

            <div className="chart-legend">
              {CATEGORIES.map((category) => (
                <div className="legend-item" key={category}>
                  <span
                    className="legend-color"
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[category],
                    }}
                  />

                  <span>{category}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRANSACTIONS + BAR CHART */}
        <section className="content-grid">
          {/* Recent Transactions */}
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
                        {getCategoryIcon(expense.category)}
                      </div>

                      <div className="transaction-info">
                        <h3>{expense.title}</h3>

                        <p>{formatDate(expense.date)}</p>
                      </div>
                    </div>

                    <div className="transaction-right">
                      <span className="transaction-amount">
                        {formatAmount(expense.amount)}
                      </span>

                      <button
                        className="icon-button delete"
                        onClick={() =>
                          handleDeleteExpense(expense)
                        }
                        title="Delete expense"
                      >
                        <FaTrash />
                      </button>

                      <button
                        className="icon-button edit"
                        onClick={() =>
                          openEditModal(expense)
                        }
                        title="Edit expense"
                      >
                        <FaEdit />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Expenses */}
          <div className="top-expenses-section">
            <h2 className="section-title">
              Top Expenses
            </h2>

            <div className="bar-chart-container">
              <ResponsiveContainer width="100%" height="100%">
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
                    tickFormatter={(value) => `₹${value}`}
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
                    radius={[0, 4, 4, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </main>

      {/* ADD BALANCE MODAL */}
      {modalType === "balance" && (
        <ModalOverlay onClose={closeModal}>
          <BalanceForm
            onSubmit={handleAddBalance}
            onCancel={closeModal}
          />
        </ModalOverlay>
      )}

      {/* ADD / EDIT EXPENSE MODAL */}
      {modalType === "expense" && (
        <ModalOverlay onClose={closeModal}>
          <ExpenseForm
            expense={editingExpense}
            onSubmit={handleAddExpense}
            onCancel={closeModal}
          />
        </ModalOverlay>
      )}
    </div>
  );
}

/* ---------------- MODAL ---------------- */

function ModalOverlay({ children, onClose }) {
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal-container"
        onMouseDown={(event) => event.stopPropagation()}
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

/* ---------------- BALANCE FORM ---------------- */

function BalanceForm({ onSubmit, onCancel }) {
  const [amount, setAmount] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit(amount);
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
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
            placeholder="Enter amount"
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

/* ---------------- EXPENSE FORM ---------------- */

function ExpenseForm({
  expense,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    title: expense?.title || "",
    amount: expense?.amount || "",
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
    <form className="modal-form" onSubmit={handleSubmit}>
      <h2>
        {expense ? "Edit Expense" : "Add Expenses"}
      </h2>

      <div className="form-grid">
        {/* Title */}
        <div className="form-group">
          <label htmlFor="title">Title</label>

          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            placeholder="Title"
          />
        </div>

        {/* Amount */}
        <div className="form-group">
          <label htmlFor="amount">Price</label>

          <input
            id="amount"
            name="amount"
            type="number"
            min="1"
            step="0.01"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Price"
          />
        </div>

        {/* Category */}
        <div className="form-group">
          <label htmlFor="category">Category</label>

          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="">Select category</option>

            {CATEGORIES.map((category) => (
              <option value={category} key={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div className="form-group">
          <label htmlFor="date">Date</label>

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
          {expense ? "Update Expense" : "Add Expense"}
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