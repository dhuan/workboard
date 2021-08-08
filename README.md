# Workboard 

> This project was built as part of CS50W's "Capstone" project assignment. It's not actively maintained, therefore not a good idea to use it in production.

## Features

- Create Project Boards, and then create tickets within them.
- Organize your boards with Lists. It starts out with Todo/Progress/Review/Done, but you're free to add as many others lists as you'd like.
- Arrange your Lists according to your team's needs, moving them left and right.
- Discuss about tickets, making comments.
- Keep track of tickets' progress. Whenever tickets are moved between different Lists, or edited, that information becomes visible in the Ticket's History section.

## Setting up

Workboard depends on Python, Django and SQLite. Once those dependencies are installed, you can run the migrations which will set up the database for you:

```
python3 manage.py migrate
```

With that, you should be ready to run the application:

```
python3 manage.py runserver
```

