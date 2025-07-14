# Overview
The objective of this application is to act as an automation agent that scrapes book data from [BookDP](https://bookdp.com.au) based on a thematic keyword and to add some extra data to the search results with the asistance of AI. The LLM API used is `GPT 4 Turbo` from `Open AI`.

The automation agent will carry out the following tasks:

1. Search for books based on the `theme` provided by the user.
2. Extract details like `Title`, `Author`, `Current price`, `Original price` and `product URL`
3. Get additional description from each product found.
4. Use AI to generate a `1-2 sentence` summary.
5. Assign a relevance score that quantifies how well the book's description matches the user-supplied theme.
6. If discounted, calculate the `Discount amount` and `Discount percentage`
7. Calculate a `Value score` for each book which is the `relevance score` divided by the `current price`.
8. Integrate with [Make.com](https://make.com) to add the book data to a Google Sheet.


## Project setup
This project uses Docker Compose and requires a few environment variables to connect to external services like Redis, PostgreSQL, and a third-party API. Therefore, a `Dockerfile` and `docker-compose.yml` file are included in the repository for easy setup. To also make things easier, a `.env` file would be required in the root directory of the repository. You can follow the steps below:

1. Copy the `.env.example` file into a new `.env` file
   ```bash
    cp .env.example .env
   ```
2. Edit the contents of the file and replace the values with yours.
3. Start the project using the command below
   ```bash
   docker-compose up --build
   ```
4. In your terminal, you should see a link to a swagger documentation page. You can test the endpoints directly using Swagger from this page (your PORT might be diferent). You can visit the URL in your browser directly by doing a CTRL/CMD + click on the link.
   ```bash
   Server running on: http://localhost:8000
   Swagger doc: http://localhost:8000/v1/documentation
   ```
5. You can reset the app by running the following commands
   ```bash
    docker-compose down -v
    docker-compose up --build
   ```
   This will remove volumes and reset your PostgreSQL data.


## Architecture
There are a few key components in the architecture of this app. First of all, this app is built using the Nest.js framework due to its excellent design, its rich ecosystem of libraries/plugins and its tight integration with TypeScript.
I chose Postgres as the data store due to its speed and performance. Theere's also a Redis setup required for background jobs using the BullMQ library.

There are a number of ways to implement the web scraping for book descriptions.
1. Use a single browser context to open as many pages as required - up to 32 pages as per the app's requirements. This is CPU/memory intensive and it might might crash the app.
2. Open a single page and process each book independently, or open a new page one after the other to achieve the same thing. While this approach would consume little CPU/memory, it would take too long.
3. Use worker threads to split the pages into chunks. This would be faster and more efficient than the previous options but the code might look complex even if it really isn't. Also, if any of the worker processes fails, implementing retries would increase the complexity of the logic.
4. Use Redis-backed background jobs. This is just as efficient as worker threads but with the added benefit of retries being in-built. Also, it is easy to setuop a UI dashboard for visualising the background jobs and also monitoring metrics of the running jobs. You can also setup a parent-child relationship between related jobs. This is the approach that I used here.

When a user requests for a book search, the app goes through the following steps:
1. Fetch the first 2 pages of the search results on `BookDP` related to the theme provided by the user.
2. Collate the results together into a single array of book data.
3. Split these book data into chunks and create background jobs to process them.
4. Each background job would then visit the details page of each book and scrape its description. Once that is done, we construct a detailed prompt and supply it to the OpenAI agent that carries out the data enrichment steps listed in the overview section above (summarizing the book from its description, fetching author details, calculating relevance scores etc)
5. A parent job collates the enriched book data once more and sends them to a Google Sheet file that has been configured via the Make.com integration.
6. The original user request is then updated to a `done` status.

## Make.com integration
![Screenshot 2025-05-22 at 8 45 21 AM](https://github.com/user-attachments/assets/4debaf7f-7f68-47fc-bfb8-6be1d5977563)

The Make.com integration involves creating a Scenario that includes combining a custom webhook and the Google Sheets module available on the platform.

![Screenshot 2025-05-22 at 8 47 00 AM](https://github.com/user-attachments/assets/7cdd4f9b-b847-4223-8b06-47507575a858)

- We first add a custom webhook name and a URL is provided for us.
- Then, we add the Google Sheets module and configure it as follows using the `Bulk Add Rows` option.

![Screenshot 2025-05-22 at 8 48 58 AM](https://github.com/user-attachments/assets/4d5725e2-315d-4e27-898f-6210e9660c26)

- First we connect to our Google account and then select a spredsheet that must have been created before hand.
- Then we select the name of the sheet that we want to write our data to. In this screenshot, I used a sheet named `Main`. The sheet should have headers that match the rows of data we intend to push to the webhook.
- Next, we toggle on the checkbox for processing our data immediately it arrives and then we click on the `Run Once` button to test our integration
  
  ![Screenshot 2025-05-22 at 8 52 12 AM](https://github.com/user-attachments/assets/f3e9735c-ae08-4a93-93ec-49868abec683)
  
- If successful, the Google Sheets module would capture our payload and we can then use that to select the `rows` property. Then we save and enable the scenario. Once that is done, subsequent posting of data to the configured webhook would trigger data insertion into the spreadsheet.

![Screenshot 2025-05-22 at 8 55 31 AM](https://github.com/user-attachments/assets/520c5efa-a8c8-47ee-b26f-c3e316151253)

#### Screenshot showing history of successful updates to the Google Sheet and sample value/relevance scores.

![Screenshot 2025-05-22 at 8 56 27 AM](https://github.com/user-attachments/assets/b04f7da4-e02e-485f-ba8b-762731f324e9)
![Screenshot 2025-05-22 at 9 30 51 AM](https://github.com/user-attachments/assets/9b004ede-f7dd-4797-a00e-e6f6e2597c15)

## Notes

#### Real-world optimisations (TODOs)
1. In the real world, there would be some form of caching to reduce the amount of requests needed for the enrichment data and also the web scraping. We could cache book data by title, or even ISBN. We could also cache theme results for a suitable interval.
2. Error-handling could be improved, I could also have used a standard logger instead of using `console.(warn | info)`.
3. No integration tests yet.
   

