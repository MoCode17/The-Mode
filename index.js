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


// Blog page
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

// Book page
app.get("/book", async (req, res) => {
    // get list of isbn's to show covers for API
    const result = await db.query("SELECT * FROM books;");

    const booklist = result.rows;

    res.render("book.ejs", { book: booklist});
});

app.get("/book/:id", async (req, res) => {
    // get id to use for query
    const id = req.params.id;
    // find the data of that book
    const result = await db.query("SELECT * FROM books WHERE id=$1;", [id]);

    const book = result.rows[0];

    res.render("book-detail", { book: book });
});

function isValidISBN(isbn) {
    // isbn must be string type
    // length must be 10 or 13
    let n = isbn.length; 
    console.log(n);
    if (n != 10 && n != 13){
        return false;
    }

    // Computing weighted sum of  
    // first 9 digits 
    let sum = 0; 
    if (n == 10){
        for (let i = 0; i < 9; i++) 
        { 
            const digit = parseInt(isbn[i], 10);
            if (isNaN(digit)) return false; // Ensure each character is a digit
            sum += ((i + 1) * digit);
        } 
        console.log(sum);
        const checkDigit = isbn[9] === "X" ? 10 : parseInt(isbn[9], 10);
        if (isNaN(checkDigit)) return false;

        return (sum % 11) === checkDigit;
    }
    
    if(n == 13){
        for(let i = 0; i < 12; i++) {
            const digit = parseInt(isbn[i], 10);
            if (isNaN(digit)) return false;
            sum += (i % 2 == 0) ? digit : digit * 3;
        }
        const checkDigit = parseInt(isbn[12], 10);
        if (isNaN(checkDigit)) return false;
        console.log(checkDigit)
        return checkDigit === (10 - (sum % 10)) % 10;
    }

    return false;
}

app.post("/book", async (req, res) => {
    const title = req.body.title;
    const author = req.body.author;
    const isbn = req.body.isbn;
    const summary = req.body.summary;
    console.log(req.body);

    if (isValidISBN(String(isbn))){
        console.log("Valid ISBN number");
        await db.query("INSERT INTO books (title, author, isbn, summary) VALUES ($1, $2, $3, $4);",
        [title, author, String(isbn), summary]
        );
    } 
    else{
        console.log("Yooo invalid cuh");
        return res.render("error.ejs", { message: "Invalid ISBN" });
    }

    res.redirect("/book");
});

// Quote Page
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