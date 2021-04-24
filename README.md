# Sevici Assistant Dialogflow Chatbot
A project I made for the Seville Cycle hire network (Sevici) to learn how to use dialogflow, as well as explore Google's various APIs including Geocoding, Directions, Static Maps, etc. Building my own chatbot

This is supposed to be ran on a web server and plugged into dialogflow. The dialogflow agent would have various intents, like "searching for a station". One of the paramaters was a list of "criteria", allowing the user to search for multiple flags in one sentence.

It allowed for finding stations based on criteria like the closest/furthest to you or a provided location, one with bikes to rent or space to park, optimal stations (with a bike to rent and somewhere to park it) between you and your destination or two locations, asking about specific stations, etc

For example, the user could say
`Where's the farthest station from here where I can park`
The chatbot would detect various instances of the "criteria" entity, which would then be sent to this app as an array. It uses synonyms, so it'd always send the first word of the list of synonyms.
In this case, it'd send a "criteria" array with the value `['furthest', 'with free dock']` as those are the definitions, with "farthest" and "can park" being synonyms of these.

This is then [transformed into a query](https://github.com/Wazbat/sevici/blob/4debb6504b05903e6704a910c076d2925e3fbfe0/utils/general.js#L15), and passed downstream

One problem I came accross was a user could request a station, however Google Assistant would not provide the user's location until they answered yes to a consent check. That's why [most intent functions check if the location is present in the request, and if not, performs a permissions request](https://github.com/Wazbat/sevici/blob/4debb6504b05903e6704a910c076d2925e3fbfe0/intentFunctions/app.station.search.js#L8)

Another small limitation was that Google Assistant can't actually display a map widget, however I got around this by sending [cards with an "Image" being a static map generated using relevant data](https://github.com/Wazbat/sevici/blob/2226ebbc67774a724511b85dd0eec2335bdce053/utils/general.js#L190), like a drawing of the route or map markers to show the station

I was really happy with how this project turned out, and it was a huge learning experience for me. I really wanted to optimize it and improve in it, however a lack of spare time combined with a sudden coronavirus pandemic meant that I didn't have the time to continue

[Despite a promising initial reaction](https://i.imgur.com/CvXrE8t.png), a lack of proper responses from Sevici other than "We're waiting for a reply" meant that I eventually lost drive and abandoned the project. Still, it was great fun to learn and see what could be made with these APIs

![In action](https://i.imgur.com/LYHrVrX.png)
