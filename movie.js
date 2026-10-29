document.addEventListener("DOMContentLoaded", () => {
  const searchForm = document.querySelector("#search-form");
  const searchInput = document.querySelector("#movie-search");
  const cards = Array.from(document.querySelectorAll(".movie-card"));
  const searchStatus = document.querySelector("#search-status");
  const emptyState = document.querySelector("#empty-state");
  const year = document.querySelector("#current-year");

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  if (searchForm && searchInput) {
    const filterMovies = () => {
      const query = searchInput.value.trim().toLocaleLowerCase();
      let visibleCount = 0;

      cards.forEach((card) => {
        const searchableText = `${card.dataset.search || ""} ${card.textContent}`.toLocaleLowerCase();
        const isMatch = searchableText.includes(query);
        card.hidden = !isMatch;
        if (isMatch) {
          visibleCount += 1;
        }
      });

      if (searchStatus) {
        searchStatus.textContent = query
          ? `${visibleCount} ${visibleCount === 1 ? "movie" : "movies"} found`
          : "";
      }
      if (emptyState) {
        emptyState.hidden = visibleCount > 0;
      }
    };

    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      filterMovies();
    });
    searchInput.addEventListener("input", filterMovies);
  }

  const commentForm = document.querySelector("#comment-form");
  if (!commentForm) {
    return;
  }

  const movieId = document.body.dataset.movieId;
  const commentList = document.querySelector("#comment-list");
  const commentStatus = document.querySelector("#comment-status");
  const storageKey = `movie-review-comments:${movieId}`;
  let comments = [];

  const setStatus = (message) => {
    if (commentStatus) {
      commentStatus.textContent = message;
    }
  };

  const renderComments = () => {
    commentList.replaceChildren();

    comments.forEach((comment, index) => {
      const article = document.createElement("article");
      article.className = "comment-item";

      const heading = document.createElement("h3");
      const author = document.createElement("span");
      author.textContent = comment.name;
      const date = document.createElement("time");
      const commentDate = new Date(comment.date);
      date.dateTime = commentDate.toISOString();
      date.textContent = commentDate.toLocaleString();

      const actions = document.createElement("span");
      actions.className = "comment-meta-actions";
      const deleteButton = document.createElement("button");
      deleteButton.className = "comment-delete";
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("aria-label", `Delete comment by ${comment.name}`);
      deleteButton.addEventListener("click", () => {
        const nextComments = comments.filter((_, commentIndex) => commentIndex !== index);
        try {
          if (nextComments.length) {
            localStorage.setItem(storageKey, JSON.stringify(nextComments));
          } else {
            localStorage.removeItem(storageKey);
          }
        } catch (error) {
          setStatus("The comment could not be deleted. Check this browser's storage settings.");
          console.error("Could not delete movie comment:", error);
          return;
        }

        comments = nextComments;
        renderComments();
        setStatus("Comment deleted.");
      });
      actions.append(date, deleteButton);
      heading.append(author, actions);

      const body = document.createElement("p");
      body.textContent = comment.text;
      article.append(heading, body);
      commentList.append(article);
    });
  };

  try {
    const savedComments = localStorage.getItem(storageKey);
    if (savedComments) {
      const parsedComments = JSON.parse(savedComments);
      if (
        !Array.isArray(parsedComments) ||
        !parsedComments.every(
          (comment) =>
            comment &&
            typeof comment.name === "string" &&
            typeof comment.text === "string" &&
            typeof comment.date === "string" &&
            Number.isFinite(Date.parse(comment.date)),
        )
      ) {
        throw new Error("Saved comments have an invalid format.");
      }
      comments = parsedComments;
    }
    renderComments();
  } catch (error) {
    setStatus("Saved comments could not be loaded. Check this browser's storage settings.");
    console.error("Could not load movie comments:", error);
  }

  commentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(commentForm);
    const name = String(formData.get("name") || "").trim();
    const text = String(formData.get("comment") || "").trim();

    if (!name || !text) {
      setStatus("Enter your name and a comment before posting.");
      return;
    }

    const nextComments = [
      ...comments,
      { name: name.slice(0, 50), text: text.slice(0, 600), date: new Date().toISOString() },
    ];

    try {
      localStorage.setItem(storageKey, JSON.stringify(nextComments));
    } catch (error) {
      setStatus("Your comment could not be saved. Check this browser's storage settings.");
      console.error("Could not save movie comment:", error);
      return;
    }

    comments = nextComments;
    renderComments();
    commentForm.reset();
    setStatus("Your comment has been saved on this device.");
  });
});
