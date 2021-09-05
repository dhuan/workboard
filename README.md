# Workboard 

> This project was built as part of CS50W's "Capstone" project assignment. It's not actively maintained, therefore not a good idea to use it in production.

## Features

- Create Project Boards, and then create tickets within them.
- Organize your boards with Lists. It starts out with Todo/Progress/Review/Done, but you're free to add as many others lists as you'd like.
- Arrange your Lists according to your team's needs, moving them left and right.
- Discuss about tickets, making comments.
- Keep track of tickets' progress. Whenever tickets are moved between different Lists, or edited, that information becomes visible in the Ticket's History section.

https://user-images.githubusercontent.com/2403890/132137817-6da58d8b-8238-42a7-b2ec-1a5b56c2f0fb.mp4

## Setting up

Follow any of the methods below to install Workboard and then on your browser, open up the app visiting http://localhost:3000 

### Docker

This is easiest method. The commands below will create the Docker image and then startup the container.

```
docker build -t workboard .

docker run -ti -p 8000:8000 workboard
```

### Normal installation

Workboard depends on Python, Django and SQLite. Once those dependencies are installed, you can run the migrations which will set up the database for you:

```
python3 manage.py migrate
```

With that, you should be ready to run the application:

```
python3 manage.py runserver
```


