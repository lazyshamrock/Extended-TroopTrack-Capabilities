import axios from "axios";

export class WordPress {
  constructor(wpConfig) {
    // Store the URL from the wpConfig object
    this.url = wpConfig.url;
    //console.log(wpConfig.password);

    // Create the headers object with the authorization and content-type headers
    this.headers = {
      Authorization: "Basic " + Buffer.from(`${wpConfig.username}:${wpConfig.password}`).toString('base64'),
      "Content-Type": "application/json",
      
    };
  }

  async createPost(post) {
    try {
      const response = await axios.post(`${this.url}/wp-json/wp/v2/mtg`, post, { headers: this.headers });
      return response.data;
    } catch (error) {
      throw new Error(`Error while creating meeting: ${error}`);
    }
  }
}

