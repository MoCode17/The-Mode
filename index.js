import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3000;

// Set EJS as the view engine
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "mode",
    password: "silversurfer",
    port: 5432
});
db.connect();

app.get("/", (req, res) => {
    res.render("landing.ejs");
});

app.get("/index", (req, res) => {
    res.render("index.ejs");
});

app.get("/blog", async (req, res) => {
    try {
        const blogs = await db.query("SELECT * FROM blogs ORDER BY created_at DESC");  // Fetch all blogs from the database
        res.render("blog.ejs", { blogs: blogs.rows });  // Pass blogs as an object to the template
    }
    catch (error) {
        console.error("Error fetching blogs: ", error);
        res.status(500).send("Error fetching blog posts");
    }
});

app.post('/blog', async (req, res) => {
    const { title, author, content } = req.body;

    try {
        const result = await db.query(
            "INSERT INTO blogs (title, author, content) VALUES ($1, $2, $3) RETURNING *",
            [title, author, content]
        );
        console.log("Blog saved:", result.rows);
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
        await db.query("DELETE FROM blogs WHERE id = $1", [blogId]);
        
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
        const { rows } = await db.query("SELECT * FROM blogs WHERE id = $1", [blogId]);
        const blog = rows[0];

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

// Quote API
const Design_API = "";
const Anime_API = "https://animechan.io/api/v1/quotes/random";
const Zen_API = "https://zenquotes.io/api/random";

app.get("/quote", (req, res) => {
    res.render("quote.ejs");
});

app.get("/quotes/anime", async (req, res) => {
    try {
        const response = await axios.get(Anime_API);
        const animeQuote = JSON.stringify(response.data.data.content);
        const animeCharacter = "-" + JSON.stringify(response.data.data.character.name).replace(/['"]/g, '');
        const animeTitle = JSON.stringify(response.data.data.anime.name).replace(/['"]/g, '');

        res.render("quotes/anime.ejs", {animeQuote, animeCharacter, animeTitle});
    }
    catch (error) {
        console.error("Error fetching anime quote:", error);
        //res.status(500).send("Failed to fetch quote");
        res.render("quotes/anime.ejs", {animeQuote: "NOOOOOO", animeCharacter: "Moey", animeTitle: "API is tired"});
    }
}
);

app.get("/quotes/zen", async (req, res) => {
    try {
        const r = await axios.get(Zen_API);
        const zenQuote = JSON.stringify(r.data[0].q).replace(/['"]/g, '');;
        const zenAuthor = JSON.stringify(r.data[0].a).replace(/['"]/g, '');;

        console.log(zenQuote, "\n", zenAuthor);

        res.render("quotes/zen.ejs", {zenQuote, zenAuthor});
    }
    catch (error) {
        //res.status(500).send("Failed to fetch quote");
        res.render("quotes/zen.ejs", {zenQuote: "NOOOOOO", zenAuthor: "Moey"});
    }
})

app.get("/video", (req, res) => {
    res.render("video.ejs");
});

app.get("/vision", (req, res) => {
    res.render("vision.ejs");
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });