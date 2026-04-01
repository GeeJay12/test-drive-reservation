You are here to understand the setup details, but take a minute to know why I made a few things in the way I did
If you are too busy then you can look the setup details [here](local-setup.md)

## Highlights

- I support making reservations even without making a availability check in first place
- With the same query, I can serve query patterns like
  -- When I choose a desired vehicle, location and time window, can you tell me which dates are available in next X days ?
  -- My work is hectic I dont have a fixed window that I am available. Would you tell me the availability on
  X, Y dates for Dublin location and Audi A8 car?
  -- Give me the test drive bookings for today for a given location for showroom manager dashboard query

## My Product Mindset

How do I optimise fair vehicle usage

- Strategy 1 (Simple): Plain round robbin allocation based upon driven count
- Strategy 2 (Moderate): Get the km or miles driven for each test drive, so that I will allocate vehicle that is driven lesser kms
- Strategy 3 (Superior): Although Strategy 2 looks cool on the face of it, here is the problem
  Lets us say that we have two Tesla Model X, one with driven km of 2K kms and another with 8K kms
  According to Strategy 2, the car with 2K will be allocated for test drive until it reaches 8K Kms of driving
  But resale value on 2K driven car(A) is higher than 8K dirven car(B).
  Using the car A for most test drives will inrease drastically the resale value
  By this I mean, at the end of X test drives if the customers tootally drove 1K kms
  If we have used A, then its resale values drops more when compared to resale value of car B
  Plus I will use some statistical modelling to apply weights like color, number of owners, insurance lapse date etc

Quick Question : Should I allocate the vehicle(choose between car A and B) when a reservation is made ?
My Take: No. Ask me why during interview

There are also other tech decisions like below which I can explain deatil when we meet

- Choice of DB
- Why \_version instead of Locks ?
- Shard and Parition Pattern
- Indexing and Constraints decision
- Why my data is slightly denormalied ?
- Bounded Time polciy [Start, End)
- Optimisations during time window overlap check
- PITR Data backup incase of fault
- Master-Slave DB with sync
- How to Scale when minimum rest time or avilability of vehicles changes post reservation ?
- How do I monitor above said changes and notify for sure ?
- Orechestation vs Choreography
- and your questions too

# Lastly, how will I handle partiall vehicle unavailability like not available until 5 PM today.

- Have slots, holiday table etc
