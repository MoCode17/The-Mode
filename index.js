import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import Blog from "./models/blog.js"

const app = express();
const port = 3000;

// Set EJS as the view engine
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/blogDB', { useNewUrlParser: true, useUnifiedTopology: true });

app.get("/", (req, res) => {
    res.render("landing.ejs");
});

app.get("/index", (req, res) => {
    res.render("index.ejs");
});

app.get("/blog", async (req, res) => {
    try {
        const blogs = await Blog.find({});  // Fetch all blogs from the database
        res.render("blog.ejs", { blogs });  // Pass blogs as an object to the template
    }
    catch (error) {
        console.error("Error fetching blogs: ", error);
        res.status(500).send("Error fetching blog posts");
    }
});

app.post('/blog', async (req, res) => {
    const { title, author, content } = req.body;

    const newBlog = new Blog({ title, content, author });
    try {
        await newBlog.save();
        console.log("Blog saved:", newBlog);
        res.redirect('/blog'); // Redirect to the blog page after saving
    } catch (error) {
        console.error("Error saving blog:", error);
        res.status(500).send("Error saving the blog");
    }
});

// Handle Blog Deletion
app.post("/blog/delete/:id", async (req, res) => {
    try {
        // Get the blog ID from the URL parameter
        const blogId = req.params.id;
        
        // Delete the blog with the given ID
        await Blog.findByIdAndDelete(blogId);
        
        console.log(`Blog with ID ${blogId} deleted.`);
        
        // Redirect to the blog list page
        res.redirect('/blog');
    } catch (error) {
        console.error("Error deleting blog:", error);
        res.status(500).send("Error deleting blog post");
    }
});

app.get("/blog/:id", async (req, res) => {
    const blogId = req.params.id;

    try {
        const blog = await Blog.findById(blogId);

        if (blog) {
            res.render("blog-detail.ejs", { blog });
        }
        else {
            res.status(404).send("Blog not found.");
        }
    }
    catch (error) {
        console.error("Error Fetching Blog:", error);
        res.status(500).send("Error fetching blog post.");
    }
});

app.get("/book", (req, res) => {
    res.render("book.ejs");
});

app.get("/quote", (req, res) => {
    res.render("quote.ejs");
});

app.get("/video", (req, res) => {
    res.render("video.ejs");
});

app.get("/vision", (req, res) => {
    res.render("vision.ejs");
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });