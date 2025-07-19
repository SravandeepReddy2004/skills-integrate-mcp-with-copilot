document.addEventListener("DOMContentLoaded", () => {

  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const sortSelect = document.getElementById("sort-select");

  let allActivities = {};

  // Helper: get unique categories from activities
  function getCategories(activities) {
    const categories = new Set();
    Object.values(activities).forEach((details) => {
      if (details.category) categories.add(details.category);
    });
    return Array.from(categories);
  }

  // Render activities based on filters
  function renderActivities() {
    let activities = Object.entries(allActivities);

    // Filter by category
    const selectedCategory = categoryFilter ? categoryFilter.value : "";
    if (selectedCategory) {
      activities = activities.filter(([, details]) => details.category === selectedCategory);
    }

    // Search filter
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";
    if (searchTerm) {
      activities = activities.filter(([name, details]) =>
        name.toLowerCase().includes(searchTerm) ||
        (details.description && details.description.toLowerCase().includes(searchTerm))
      );
    }

    // Sort
    const sortBy = sortSelect ? sortSelect.value : "name";
    activities.sort((a, b) => {
      if (sortBy === "name") {
        return a[0].localeCompare(b[0]);
      } else if (sortBy === "time") {
        // Assume details.schedule is a string, try to parse as date/time if possible
        const aTime = Date.parse(a[1].schedule) || 0;
        const bTime = Date.parse(b[1].schedule) || 0;
        return aTime - bTime;
      }
      return 0;
    });

    // Render
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
    if (activities.length === 0) {
      activitiesList.innerHTML = "<p>No activities found.</p>";
      return;
    }
    activities.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;

      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Category:</strong> ${details.category || "General"}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;

      activitiesList.appendChild(activityCard);

      // Add option to select dropdown
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  // Populate category filter options
  function populateCategories() {
    if (!categoryFilter) return;
    const categories = getCategories(allActivities);
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categoryFilter.appendChild(opt);
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      allActivities = activities;
      populateCategories();
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // ...existing code for handleUnregister...

  // ...existing code for signupForm submit handler...

  // Event listeners for filters
  if (searchInput) searchInput.addEventListener("input", renderActivities);
  if (categoryFilter) categoryFilter.addEventListener("change", renderActivities);
  if (sortSelect) sortSelect.addEventListener("change", renderActivities);

  // Initialize app
  fetchActivities();
});
