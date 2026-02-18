// FETCH FUNCTIONS (Promises)

// fetchUserProfile(userId) - 1 second delay
function fetchUserProfile(userId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = {
        id: userId,
        name: "Karen Nguyen",
        email: "n01440923@humbermail.ca",
        username: "n01440923"
      };
      resolve(user);
    }, 1000);
  });
}

// fetchUserPosts(userId) - 1.5 second delay
function fetchUserPosts(userId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const posts = [
        { postId: 1, userId: userId, title: "Post 1", content: "This is post one." },
        { postId: 2, userId: userId, title: "Post 2", content: "This is post two." },
        { postId: 3, userId: userId, title: "Post 3", content: "This is post three." }
      ];
      resolve(posts);
    }, 1500);
  });
}

// fetchPostComments(postId)
function fetchPostComments(postId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.3) {
        reject(new Error("Failed to fetch comments"));
        return;
      }

      const comments = [
        { commentId: 1, postId: postId, username: "alex", comment: "Nice post!" },
        { commentId: 2, postId: postId, username: "sam", comment: "Good info." },
        { commentId: 3, postId: postId, username: "mia", comment: "Thanks for sharing!" }
      ];
      resolve(comments);
    }, 2000);
  });
}

// Sequential fetching
async function fetchDataSequentially(userId) {
  console.log("Starting sequential fetch...");
  const startTime = Date.now();

  const result = {
    mode: "sequential",
    timeMs: 0,
    user: null,
    posts: [],
    errors: []
  };

  try {
    const user = await fetchUserProfile(userId);
    console.log("User profile retrieved");
    result.user = user;

    const posts = await fetchUserPosts(userId);
    console.log("Posts retrieved");

    for (const post of posts) {
      try {
        const comments = await fetchPostComments(post.postId);
        console.log(`Comments retrieved for post ${post.postId}`);
        result.posts.push({ ...post, comments: comments, commentError: null });
      } catch (error) {
        console.log(`Comments failed for post ${post.postId}`);
        result.errors.push(`Post ${post.postId}: ${error.message}`);
        result.posts.push({ ...post, comments: [], commentError: error.message });
      }
    }
  } catch (error) {
    console.error("Error in sequential fetch:", error.message);
    result.errors.push(error.message);
  }

  const endTime = Date.now();
  result.timeMs = endTime - startTime;
  console.log(`Sequential fetch took ${result.timeMs}ms`);

  return result;
}

// Parallel fetching
async function fetchDataInParallel(userId) {
  console.log("Starting parallel fetch...");
  const startTime = Date.now();

  const result = {
    mode: "parallel",
    timeMs: 0,
    user: null,
    posts: [],
    errors: []
  };

  try {
    const [user, posts] = await Promise.all([
      fetchUserProfile(userId),
      fetchUserPosts(userId)
    ]);

    console.log("User and posts retrieved simultaneously");
    result.user = user;

    const commentResults = await Promise.allSettled(
      posts.map((post) => fetchPostComments(post.postId))
    );

    result.posts = posts.map((post, index) => {
      const res = commentResults[index];

      if (res.status === "fulfilled") {
        console.log(`Comments retrieved for post ${post.postId}`);
        return { ...post, comments: res.value, commentError: null };
      } else {
        console.log(`Comments failed for post ${post.postId}`);
        result.errors.push(`Post ${post.postId}: ${res.reason.message}`);
        return { ...post, comments: [], commentError: res.reason.message };
      }
    });
  } catch (error) {
    console.error("Error in parallel fetch:", error.message);
    result.errors.push(error.message);
  }

  const endTime = Date.now();
  result.timeMs = endTime - startTime;
  console.log(`Parallel fetch took ${result.timeMs}ms`);

  return result;
}

// Master function
async function getUserContent(userId) {
  console.log("=== Fetching all user content ===");

  try {
    const user = await fetchUserProfile(userId);
    console.log("Step 1: User profile retrieved -", user.name);

    const posts = await fetchUserPosts(userId);
    console.log("Step 2: Posts retrieved -", posts.length);

    const commentResults = await Promise.allSettled(
      posts.map((post) => fetchPostComments(post.postId))
    );

    const postsWithComments = posts.map((post, index) => {
      const res = commentResults[index];
      if (res.status === "fulfilled") {
        return { ...post, comments: res.value, commentError: null };
      } else {
        return { ...post, comments: [], commentError: res.reason.message };
      }
    });

    console.log("Step 3: Comments retrieved");

    const allContent = {
      user: user,
      posts: postsWithComments
    };

    console.log("Step 4: All data combined");
    return allContent;

  } catch (error) {
    console.error("Failed to fetch user content:", error.message);
    throw error;
  }
}

// Display results
function displayResults(data, container) {
  container.innerHTML = "";

  const topInfo = document.createElement("p");
  topInfo.innerHTML = `<strong>Mode:</strong> ${data.mode} | <strong>Time:</strong> ${data.timeMs}ms`;
  container.appendChild(topInfo);

  if (!data.user) {
    container.innerHTML += "<p>No user data returned.</p>";
    return;
  }

  const userDiv = document.createElement("div");
  userDiv.innerHTML = `
    <h2>User</h2>
    <p><strong>Name:</strong> ${data.user.name}</p>
    <p><strong>Username:</strong> ${data.user.username}</p>
    <p><strong>Email:</strong> ${data.user.email}</p>
  `;
  container.appendChild(userDiv);

  const postsTitle = document.createElement("h2");
  postsTitle.textContent = "Posts";
  container.appendChild(postsTitle);

  data.posts.forEach((post) => {
    const postDiv = document.createElement("div");
    postDiv.className = "post";

    postDiv.innerHTML = `
      <h3>${post.title}</h3>
      <p>${post.content}</p>
    `;

    if (post.commentError) {
      const errP = document.createElement("p");
      errP.className = "comment";
      errP.innerHTML = `<strong>Comments error:</strong> ${post.commentError}`;
      postDiv.appendChild(errP);
    }

    if (!post.comments || post.comments.length === 0) {
      const none = document.createElement("p");
      none.className = "comment";
      none.textContent = "(No comments returned)";
      postDiv.appendChild(none);
    } else {
      post.comments.forEach((c) => {
        const cP = document.createElement("p");
        cP.className = "comment";
        cP.textContent = `@${c.username}: ${c.comment}`;
        postDiv.appendChild(cP);
      });
    }

    container.appendChild(postDiv);
  });

  if (data.errors && data.errors.length > 0) {
    const msg = document.createElement("p");
    msg.innerHTML = "<strong>Some comments failed to load.</strong> Try clicking again.";
    container.appendChild(msg);

    const errTitle = document.createElement("h3");
    errTitle.textContent = "Errors (handled)";
    container.appendChild(errTitle);

    const ul = document.createElement("ul");
    data.errors.forEach((e) => {
      const li = document.createElement("li");
      li.textContent = e;
      ul.appendChild(li);
    });
    container.appendChild(ul);
  }
}

// Button events
const outputDiv = document.getElementById("output");

document.getElementById("sequentialBtn").addEventListener("click", async () => {
  outputDiv.textContent = "Loading (sequential)...";
  const data = await fetchDataSequentially(1);
  displayResults(data, outputDiv);
});

document.getElementById("parallelBtn").addEventListener("click", async () => {
  outputDiv.textContent = "Loading (parallel)...";
  const data = await fetchDataInParallel(1);
  displayResults(data, outputDiv);
});

console.log("Script loaded");