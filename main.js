//regarding the menu
const closeMenu = document.querySelector("#close");
const openMenu = document.querySelector("#open");
const header = document.querySelector("header");

//regarding the observer
const homeSection = document.querySelector("#home");

//adding books
const addBook = document.querySelector(".add");
const bookModal = document.querySelector(".newBook");
const closeBookModal = document.querySelector(".newBook img");
const bookName = document.querySelector("#name");
const bookChapter = document.querySelector("#chapters");
const bookModalBtn = document.querySelector(".btn");

//viewing books
const viewBookModal = document.querySelector(".viewBook");
const viewBookName = document.querySelector(".viewBook > h2");
const studyProgress = document.querySelector("#studyProgress");
const viewBookProgressBar = document.querySelector(".viewBook progress");
const viewBookProgressText = document.querySelector(".viewBook progress + p");
const viewBookChapters = document.querySelector(".viewBook div:last-child");
const closeViewBookModal = document.querySelector(".closeViewPopup");

//filtering books
const filter = document.querySelector("#filter");

//menu on smaller screens
closeMenu.addEventListener("click", () => {
  if (header.classList.contains("open")) header.classList.remove("open");
  header.classList.add("close");
  setTimeout(() => {
    openMenu.style.display = "block";
  }, 500);
});

openMenu.addEventListener("click", () => {
  if (header.classList.contains("close")) header.classList.remove("close");
  header.classList.add("open");
  setTimeout(() => {
    openMenu.style.display = "none";
  }, 200);
});

//the observer
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting && window.innerWidth > 704) {
        header.classList.add("background");
      } else {
        header.classList.remove("background");
      }
    });
  },
  {
    rootMargin: "-60px 0px 0px 0px",
  }
);
observer.observe(homeSection);

//new book modal
addBook.addEventListener("click", () => {
  bookModal.style.display = "block";
});

closeBookModal.addEventListener("click", () => {
  bookModal.style.display = "none";
  //reset new book form
  bookName.value = "";
  bookChapter.value = "";
});

bookModalBtn.addEventListener("click", () => {
  if (
    bookName.value == "" ||
    bookChapter.value == "" ||
    /^\s+/.test(bookName.value)
  ) {
    alert("Fill in the proper details of a book");
    //reset new book form
    bookName.value = "";
    bookChapter.value = "";
  } else {
    //create book
    const nameArray = bookName.value.split(" ");
    const updated = nameArray.map((substring) => {
      let firstLetter = substring[0].toUpperCase();
      let remainder = substring.slice(1).toLowerCase();
      return firstLetter + remainder;
    });
    const name = updated.join(" ");
    const book = new CreateBooks(name, Number(bookChapter.value));
    store(book);
    //reset new book form
    bookName.value = "";
    bookChapter.value = "";

    bookModal.style.display = "none";
    //add the new book and ensure it updates on the page
    appendBooks();
  }
});

//view book modal
closeViewBookModal.addEventListener("click", () => {
  viewBookModal.style.display = "none";
});

//show books on page load
window.addEventListener("DOMContentLoaded", appendBooks);

//book constructor
function CreateBooks(name, chapters) {
  this.name = name;
  this.chapters = chapters;
  this.checkState = {};
  for (let i = 0; i < chapters; i++) {
    this.checkState[`chapter ${i + 1}`] = false;
  }
  this.progress = 0;
  this.favorites = false;
}

//store books
function store(book) {
  if (!localStorage.getItem("books")) {
    const books = [];
    books.push(book);
    localStorage.setItem("books", JSON.stringify(books));
  } else {
    const books = JSON.parse(localStorage.getItem("books"));
    books.push(book);
    if (books.length > 1) books.sort(sortArray);
    localStorage.setItem("books", JSON.stringify(books));
  }
}

//appending new books and updated books to all books section on page
function appendBooks() {
  const allBooksContainer = document.querySelector(".allBooks ol");
  const books = JSON.parse(localStorage.getItem("books"));

  //get favorites if they exist
  const favorites = JSON.parse(localStorage.getItem("favorites"));

  allBooksContainer.innerHTML = "";
  if (books) {
    for (let book of books) {
      let listItem = document.createElement("li");
      listItem.className = "item";

      let booksIndex = books.indexOf(book);

      let favoritesIndex = (function () {
        if (favorites != undefined || favorites != null) {
          for (let favorite of favorites) {
            if (favorite.name === book.name) return favorites.indexOf(favorite);
          }
        }
      })();

      listItem.innerHTML = `<img src="assets/pics/thumbnail.svg" alt="" class="thumbnail">
                    <h3>${book.name}</h3>
                    <progress max="100" value="0" title="0% read"></progress>
                    <img src="assets/icons/solid/eye.svg" alt="" class="eye" title="View" onclick="viewBook(${booksIndex}, ${favoritesIndex})">
                    <img src="assets/icons/regular/star.svg" alt="" title="Add to favorites" class="addFav" onclick="addFavorite(${booksIndex})">
                    <img src="assets/icons/solid/star.svg" alt="" title="Remove from favorites" class="removeFav" onclick="removeFavorite(${favoritesIndex}, ${booksIndex})">
                    <img src="assets/icons/solid/trash-can.svg" alt="" class="trash" title="Delete" onclick="deleteBook(${booksIndex})">`;
      allBooksContainer.appendChild(listItem);

      //update min progress bar
      minProgress(booksIndex, book.progress);
    }

    //indicate the favorites in all books section on page
    const regular = allBooksContainer.querySelectorAll(".addFav");
    const solid = allBooksContainer.querySelectorAll(".removeFav");

    for (let book of books) {
      let i = books.indexOf(book);
      if (book.favorites) {
        solid[i].style.display = "block";
        regular[i].style.display = "none";
      } else {
        solid[i].style.display = "none";
        regular[i].style.display = "block";
      }
    }

    //place recently read books on page
    recent();

    //indicate the favorites in recents section
    const recents = JSON.parse(localStorage.getItem("recents"));
    if (recents) {
      const recentSection = document.querySelector(".recent");
      const regular = recentSection.querySelectorAll(".addFav");
      const solid = recentSection.querySelectorAll(".removeFav");

      for (let recent of recents) {
        let bookIndex = (function () {
          for (let book of books) {
            if (book.name === recent.name) return books.indexOf(book);
          }
        })();

        const book = books[bookIndex];
        let i = recents.indexOf(recent);

        if (book.favorites) {
          solid[i].style.display = "block";
          regular[i].style.display = "none";
        } else {
          solid[i].style.display = "none";
          regular[i].style.display = "block";
        }
      }
    }

    //update favorite section
    displayFavorites();
  }
}

//delete books
function deleteBook(booksIndex) {
  const books = JSON.parse(localStorage.getItem("books"));
  const book = books[booksIndex];

  const favorites = JSON.parse(localStorage.getItem("favorites"));

  const recents = JSON.parse(localStorage.getItem("recents"));

  let favoritesIndex = (function () {
    if (favorites) {
      for (let favorite of favorites) {
        if (favorite.name === book.name) return favorites.indexOf(favorite);
      }
    }
  })();

  if (favoritesIndex != undefined) favorites.splice(favoritesIndex, 1);

  let recentsIndex = (function () {
    if (recents) {
      for (let recent of recents) {
        if (recent.name === book.name) return recents.indexOf(recent);
      }
    }
  })();

  if (recentsIndex != undefined) recents.splice(recentsIndex, 1);

  books.splice(booksIndex, 1);

  if (recents) localStorage.setItem("recents", JSON.stringify(recents));

  if (favorites) {
    if (favorites.length > 1) favorites.sort(sortArray);
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }

  if (books.length > 1) books.sort(sortArray);
  localStorage.setItem("books", JSON.stringify(books));

  //empty filter input
  filter.value = "";

  //update page
  appendBooks();
}

//view books
function viewBook(booksIndex, favoritesIndex) {
  //the progress should be displayed
  displayProgress(booksIndex, favoritesIndex);

  const books = JSON.parse(localStorage.getItem("books"));
  const book = books[booksIndex];

  const favorites = JSON.parse(localStorage.getItem("favorites"));
  const favorite =
    favoritesIndex != undefined ? favorites[favoritesIndex] : undefined;

  viewBookModal.style.display = "block";
  viewBookName.textContent = (favorite ?? book).name;
  viewBookChapters.innerHTML = "";

  //adding chapters
  for (let i = 1; i <= (favorite ?? book).chapters; i++) {
    let label = document.createElement("label");
    label.setAttribute("for", i);
    label.textContent = `Chapter ${i}`;

    let input = document.createElement("input");
    input.id = i;
    input.type = "checkbox";

    //if chapter has been marked read, ensure it is displayed as such
    if ((favorite ?? book).checkState["chapter " + i]) input.checked = true;

    viewBookChapters.appendChild(label);
    viewBookChapters.appendChild(input);
  }

  const checkboxes = viewBookChapters.querySelectorAll(
    'input[type="checkbox"]'
  );
  //adding checked/unchecked functionality for chapters
  setTimeout(() => {
    for (let i = 0; i < checkboxes.length; i++)
      checkboxes[i].addEventListener("click", () => {
        return markRead(booksIndex, i, favoritesIndex);
      });
  }, 0);
}

//mark read chapters
function markRead(booksIndex, checkBoxIndex, favoritesIndex) {
  const books = JSON.parse(localStorage.getItem("books"));
  const book = books[booksIndex];

  const favorites = JSON.parse(localStorage.getItem("favorites"));
  const favorite =
    favoritesIndex != undefined ? favorites[favoritesIndex] : undefined;

  const checkboxes = viewBookChapters.querySelectorAll(
    'input[type="checkbox"]'
  );

  //update chapter check state for books and favorites (if favorite is available or not)
  if (checkboxes[checkBoxIndex].checked) {
    (favorite ?? book).checkState[`chapter ${checkBoxIndex + 1}`] = true;
    if (favorite != undefined)
      book.checkState[`chapter ${checkBoxIndex + 1}`] = true;
  } else {
    (favorite ?? book).checkState[`chapter ${checkBoxIndex + 1}`] = false;
    if (favorite != undefined)
      book.checkState[`chapter ${checkBoxIndex + 1}`] = false;
  }

  //upgrade bookstores
  if (books.length > 1) books.sort(sortArray);
  localStorage.setItem("books", JSON.stringify(books));

  if (favorites) {
    if (favorites.length > 1) favorites.sort(sortArray);
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }

  //display current progress
  displayProgress(booksIndex, favoritesIndex);

  //update recently read
  recentsStore(booksIndex);

  //empty filter input
  filter.value = "";

  // update book list on page
  appendBooks();
}

//displaying progress
function displayProgress(booksIndex, favoritesIndex) {
  const books = JSON.parse(localStorage.getItem("books"));
  const book = books[booksIndex];

  const favorites = JSON.parse(localStorage.getItem("favorites"));
  const favorite =
    favoritesIndex != undefined ? favorites[favoritesIndex] : undefined;

  let chapters = (favorite ?? book).checkState;

  let progress = (function () {
    let readChapters = 0;
    let totalChapters = 0;
    for (let chapter in chapters) {
      if (chapters[chapter] == true) readChapters++;

      totalChapters++;
    }

    if (readChapters == 0) return 0;
    else return Math.ceil((readChapters / totalChapters) * 100);
  })();

  if (progress >= 50) {
    viewBookProgressBar.classList.add("nice");
    if (progress == 100) studyProgress.textContent = "Completed";
    else studyProgress.textContent = "Still Reading";
  } else if (progress < 50 && viewBookProgressBar.classList.contains("nice")) {
    viewBookProgressBar.classList.remove("nice");
  }
  viewBookProgressBar.setAttribute("value", progress);
  viewBookProgressText.textContent = progress + "%";

  //save progress
  (favorite ?? book).progress = progress;
  if (favorite != undefined) book.progress = progress;

  if (books.length > 1) books.sort(sortArray);
  localStorage.setItem("books", JSON.stringify(books));

  if (favorites) {
    if (favorites.length > 1) favorites.sort(sortArray);
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }
}

//small progress bar
function minProgress(index, progress) {
  const allBooksProgress = document.querySelectorAll(".allBooks ol progress")[
    index
  ];
  if (progress >= 50) {
    allBooksProgress.classList.add("nice");
  } else if (progress < 50 && allBooksProgress.classList.contains("nice")) {
    allBooksProgress.classList.remove("nice");
  }
  allBooksProgress.setAttribute("value", progress);
  allBooksProgress.title = progress + "% read";
}

//filter books
filter.addEventListener("input", (e) => {
  const text = e.target.value.toLowerCase();
  const books = JSON.parse(localStorage.getItem("books"));

  //for those funny users that would use the filter input without adding books first 🤣
  if (!books) {
    setTimeout(() => {
      filter.value = "";
    }, 2000);
    return;
  }

  //get favorites if they exist
  const favorites = JSON.parse(localStorage.getItem("favorites"));

  //if input field is blank display all books
  if (text === "" || /^\s+/.test(text)) {
    appendBooks();
    return;
  }

  //otherwise display filtered books
  const filters = [];
  for (let i = 0; i < books.length; i++) {
    const book = books[i].name.toLowerCase();
    if (book.startsWith(text)) {
      filters.push(books[i]);
    }
  }

  const allBooksContainer = document.querySelector(".allBooks ol");
  allBooksContainer.innerHTML = "";
  for (let filtered of filters) {
    let listItem = document.createElement("li");
    listItem.className = "item";

    let booksIndex = (function () {
      for (let book of books) {
        if (book.name === filtered.name) return books.indexOf(book);
      }
    })();

    let favoritesIndex = (function () {
      if (favorites) {
        for (let favorite of favorites) {
          if (favorite.name === filtered.name)
            return favorites.indexOf(favorite);
        }
      }
    })();

    let filterIndex = filters.indexOf(filtered);

    listItem.innerHTML = `<img src="assets/pics/thumbnail.svg" alt="" class="thumbnail">
                    <h3>${filtered.name}</h3>
                    <progress max="100" value="0" title="0% read"></progress>
                    <img src="assets/icons/solid/eye.svg" alt="" class="eye" title="View" onclick="viewBook(${booksIndex}, ${favoritesIndex})">
                    <img src="assets/icons/regular/star.svg" alt="" title="Add to favorites" class="addFav" onclick="addFavorite(${booksIndex})">
                    <img src="assets/icons/solid/star.svg" alt="" title="Remove from favorites" class="removeFav" onclick="removeFavorite(${favoritesIndex}, ${booksIndex})">
                    <img src="assets/icons/solid/trash-can.svg" alt="" class="trash" title="Delete" onclick="deleteBook(${booksIndex})">`;
    allBooksContainer.appendChild(listItem);

    //update min progress bar
    minProgress(filterIndex, filtered.progress);
  }

  //mark the favorites in all books section
  const regular = allBooksContainer.querySelectorAll(".addFav");
  const solid = allBooksContainer.querySelectorAll(".removeFav");

  for (let filtered of filters) {
    let bookIndex = (function () {
      for (let book of books) {
        if (book.name === filtered.name) return books.indexOf(book);
      }
    })();

    let book = books[bookIndex];

    let i = filters.indexOf(filtered);
    if (book.favorites) {
      solid[i].style.display = "block";
      regular[i].style.display = "none";
    } else {
      solid[i].style.display = "none";
      regular[i].style.display = "block";
    }
  }
});

//adding to and removing from favorites
function addFavorite(booksIndex) {
  const books = JSON.parse(localStorage.getItem("books"));
  const book = books[booksIndex];
  book.favorites = true;

  const recents = JSON.parse(localStorage.getItem("recents"));
  let recentsIndex = (function () {
    if (recents) {
      for (let recent of recents) {
        if (recent.name === book.name) return recents.indexOf(recent);
      }
    }
  })();
  const recent = recentsIndex != undefined ? recents[recentsIndex] : undefined;
  if (recent) recent.favorites = true;

  //creating and/or storing favorite books
  if (!localStorage.getItem("favorites")) {
    const favorites = [];
    favorites.push(book);
    localStorage.setItem("favorites", JSON.stringify(favorites));
  } else {
    const favorites = JSON.parse(localStorage.getItem("favorites"));
    favorites.push(book);
    if (favorites.length > 1) favorites.sort(sortArray);
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }

  //update books and recents
  if (books.length > 1) books.sort(sortArray);
  localStorage.setItem("books", JSON.stringify(books));

  if (recents) localStorage.setItem("recents", JSON.stringify(recents));

  //clear filter input
  filter.value = "";

  //update page
  appendBooks();
}

function removeFavorite(favoritesIndex, booksIndex) {
  const books = JSON.parse(localStorage.getItem("books"));
  const book = books[booksIndex];
  book.favorites = false;

  const recents = JSON.parse(localStorage.getItem("recents"));
  let recentsIndex = (function () {
    if (recents) {
      for (let recent of recents) {
        if (recent.name === book.name) return recents.indexOf(recent);
      }
    }
  })();
  const recent = recentsIndex != undefined ? recents[recentsIndex] : undefined;
  if (recent) recent.favorites = false;

  const favorites = JSON.parse(localStorage.getItem("favorites"));
  favorites.splice(favoritesIndex, 1);
  if (favorites.length > 1) favorites.sort(sortArray);
  localStorage.setItem("favorites", JSON.stringify(favorites));

  //update books and recents
  if (books.length > 1) books.sort(sortArray);
  localStorage.setItem("books", JSON.stringify(books));

  if (recents) localStorage.setItem("recents", JSON.stringify(recents));

  //clear filter input
  filter.value = "";

  //update page
  appendBooks();
}

//favorite books
function displayFavorites() {
  const favoritesContainer = document.querySelector(".favorites");
  const favorites = JSON.parse(localStorage.getItem("favorites"));
  const books = JSON.parse(localStorage.getItem("books"));

  favoritesContainer.innerHTML = "";
  favoritesContainer.innerHTML += `<h2>Favorites</h2>`;
  if (favorites) {
    for (let favorite of favorites) {
      let container = document.createElement("div");
      container.className = "item";

      let favoritesIndex = favorites.indexOf(favorite);

      let bookIndex = (function () {
        if (books) {
          for (let book of books) {
            if (book.name === favorite.name) return books.indexOf(book);
          }
        }
      })();

      container.innerHTML += `<img src="assets/pics/thumbnail.svg" alt="" class="thumbnail">
                <h3>${favorite.name}</h3>
                <img src="assets/icons/solid/eye.svg" alt="" class="eye" title="View" onclick="viewBook(${bookIndex}, ${favoritesIndex})">
                <img src="assets/icons/solid/bookmark.svg" alt="" title="Remove" onclick="removeFavorite(${favoritesIndex}, ${bookIndex})">`;
      favoritesContainer.appendChild(container);
    }
  }
}

//recently read books
function recentsStore(booksIndex) {
  const books = JSON.parse(localStorage.getItem("books"));
  const book = books[booksIndex];

  //creating and/or storing a maximum of five recent books
  if (!localStorage.getItem("recents")) {
    const recents = [];
    recents.unshift(book);
    localStorage.setItem("recents", JSON.stringify(recents));
  } else {
    let recents = JSON.parse(localStorage.getItem("recents"));
    //update the position of a recent book based on its recency
    if (recents.length < 5) {
      recents = recents.filter((recent) => {
        if (book.name != recent.name) return recent;
      });
      recents.unshift(book);
      localStorage.setItem("recents", JSON.stringify(recents));
    } else {
      recents = recents.filter((recent) => {
        if (book.name != recent.name) return recent;
      });
      if (recents.length == 5) recents.pop();
      recents.unshift(book);
      localStorage.setItem("recents", JSON.stringify(recents));
    }
  }
}

//page update
function recent() {
  const recentsContainer = document.querySelector(".recent");
  const recents = JSON.parse(localStorage.getItem("recents"));
  const books = JSON.parse(localStorage.getItem("books"));
  const favorites = JSON.parse(localStorage.getItem("favorites"));

  recentsContainer.innerHTML = "";
  recentsContainer.innerHTML += `<h2>Recently Read</h2>`;
  if (recents) {
    for (let recent of recents) {
      let container = document.createElement("div");
      container.className = "item";

      let booksIndex = (function () {
        if (books) {
          for (let book of books) {
            if (book.name === recent.name) return books.indexOf(book);
          }
        }
      })();

      let favoritesIndex = (function () {
        if (favorites) {
          for (let favorite of favorites) {
            if (favorite.name === recent.name)
              return favorites.indexOf(favorite);
          }
        }
      })();

      container.innerHTML += `<img src="assets/pics/thumbnail.svg" alt="" class="thumbnail">
                <h3>${recent.name}</h3>
                <img src="assets/icons/solid/eye.svg" alt="" class="eye" title="View" onclick="viewBook(${booksIndex}, ${favoritesIndex})">
                <img src="assets/icons/regular/star.svg" alt="" title="Add to favorites" class="addFav" onclick="addFavorite(${booksIndex})">
                <img src="assets/icons/solid/star.svg" alt="" title="Remove from favorites" class="removeFav" onclick="removeFavorite(${favoritesIndex}, ${booksIndex})">`;

      recentsContainer.appendChild(container);
    }
  }
}

//sorting function
function sortArray(second, first) {
  return first.name > second.name ? -1 : first.name < second.name ? 1 : 0;
}
