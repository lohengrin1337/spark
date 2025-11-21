<p>
  <img src="./img/scooter.svg" alt="Scooter Logo" width="200" height="200">
</p>

# Spark - An E-Scooter Rental App

## About

This app is being developed as a group project in the course ['Programutveckling i virtuella team'](https://dbwebb.se/kurser/vteam-v1) at [Blekinge Tekniska Högskola.](https://www.bth.se)

## Contributors

```
[lohengrin1337, Olof Jönsson, oljn22]
[kh3rm, Herman Karlsson, hekr23]
[lisarosengren, Lisa Rosengren, lirs24]
[emmwid81, Emma Meyer Widengård, emme24]
```

## Docker Compose

### Run services
* `docker compose up [ --build ] [ -d ] [ service name ]`

### Install dependency in a container
* `docker compose exec <service name> npm install <dependency name>`
    * reduild image (--build) on next restart