
/**
 * Index name = my_blog - Database name
 * mappings = schema which is JSON format
 */
PUT / my_blog //POST is not working ; only PUT works
{
    "mappings" : { // Schema is denoted as mappings in elastic
        "post": { // Post is  a type = collection name Ex: deals,oms
            "properties" : { //Column or fields;
                "user_id" : {
                    "type":  "integer" //Data type
                },
                "blog" :{
                    "type" : "text" // Data Type = text;
                },
                "blog_date" : {
                    "type" : "date" 
                }
            }
        }
    }
}

//View schema;
GET my_blog/_mapping


/* Insert blog in DB=my_blog collection = post;  */
POST my_blog/post
{
  "blog_date" : "2018-11-17",
  "blog_text": "This is my first blog folks !",
  "user_id": "1771"
}

//View all documents in DB=my_blog & collection = post using _search API
GET my_blog/post/_search



//Insert with custom _id ;
POST my_blog/post/BLOG001
{
  "blog_date" : "2018-11-17",
  "blog_text": "This is my Third blog with custom _id as BLOG000 - counter !",
  "user_id": "1771"
}


// Get by Id
GET my_blog/post/BLOG001




PUT /my_blog
{
  "mappings": {
    "Blogs": {
      "properties": {
        "user_id": {
          "type": "integer"
        },
        "user_name":{
          "type" : "keyword"
        },
        "blog_text": {
          "type": "text"
        },
        "blog_date": {
          "type": "date",
          "format": "date_optional_time"
        }
      }
    }
  }
}

GET my_blog/_mapping


POST my_blog/Blogs/BLOG002
{
  "blog_date" : "2018-11-17",
  "blog_text": "This is my Second Blog Folks !",
  "user_id": "1771",
  "user_name" : "Aman kareem"
}


GET my_blog/Blogs/_search


GET my_blog/Blogs/BLOG001


DELETE my_blog


//Search by query
GET my_blog/Blogs/_search?q=blog_text:second