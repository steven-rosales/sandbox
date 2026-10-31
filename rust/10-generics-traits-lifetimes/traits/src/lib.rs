pub trait Summary {
    fn summarize_author(&self) -> String {
        String::from("(unknown author)")
    }

    fn summarize(&self) -> String {
        format!("(Read more from {}...)", self.summarize_author())
    }
}

pub struct NewsArticle {
    pub headline: String,
    pub location: String,
    pub author: String,
    pub content: String,
}

impl Summary for NewsArticle {
    fn summarize_author(&self) -> String {
        format!("@{}", self.author)
    }

    // fn summarize(&self) -> String {
    //     format!("{}, by {} ({})", self.headline, self.author, self.location)
    // }
}

pub struct SocialPost {
    pub username: String,
    pub content: String,
    pub reply: bool,
    pub repost: bool,
}

impl Summary for SocialPost {
    fn summarize(&self) -> String {
        format!("{}: {}", self.username, self.content)
    }
}

impl<T: Summary> Summary for Vec<T> {
    fn summarize(&self) -> String {
        self.iter()
            .map(|item| item.summarize())
            .collect::<Vec<String>>()
            .join("\n---\n")
    }
}
