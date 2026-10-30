### Roster Details<br />
Team Name: Change The Game<br />
Roster: 957, Hack1ng, LaiKeXu, ProKiller, VanceKK<br />
Global Rank: [263](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Asia]( ../../standings_asia_2026_09_06.md)<br />
Regional Rank: [27]( ../../standings_asia_2026_09_06.md)<br />
<br />
Final Rank Value:  641.0<br />
<br />
Final Rank Value (641.0) = Starting Rank Value (641.3) + Head To Head Adjustments (-0.4)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.232[<sup>1</sup>](#table2)
- Bounty Collected: 0.175[<sup>2</sup>](#table1)
- Opponent Network: 0.006[<sup>2</sup>](#table1)
- LAN Wins: 0.095[<sup>2</sup>](#table1)

The average of these factors is 0.127<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 641.3
- 400 + ( ( 0.127 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 641.3


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.028
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent             | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                    |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           14 |     3205 | 2026-05-12 | Haunted House        | L   | 0.421      | -            | -                | -                | -         |    -5.81 | 957, Hack1ng, LaiKeXu, ProKiller, VanceKK |
|           13 |     3232 | 2026-05-12 | Vitalem Aerem Gaming | W   | 0.416      | 0.548        | 0.000 (0.000)    | 0.184 (0.042)    | 1 (0.416) |     7.66 | 957, Hack1ng, LaiKeXu, ProKiller, VanceKK |
|           12 |     3272 | 2026-05-11 | SemperFi Esports     | L   | 0.409      | -            | -                | -                | -         |    -5.57 | 957, Hack1ng, LaiKeXu, ProKiller, VanceKK |
|           11 |     4463 | 2026-04-04 | 5star eSports        | L   | 0.163      | -            | -                | -                | -         |    -1.17 | 957, Hack1ng, LaiKeXu, ProKiller, VanceKK |
|           10 |     4473 | 2026-04-04 | TYLOO                | L   | 0.162      | -            | -                | -                | -         |    -0.11 | 957, Hack1ng, LaiKeXu, ProKiller, VanceKK |
|            9 |     4545 | 2026-04-03 | FengDa Gaming        | L   | 0.156      | -            | -                | -                | -         |    -2.51 | 957, Hack1ng, LaiKeXu, ProKiller, VanceKK |
|            8 |     4555 | 2026-04-03 | Rare Atom            | W   | 0.156      | 0.352        | 0.001 (0.000)    | 0.033 (0.002)    | 1 (0.156) |     2.63 | 957, Hack1ng, LaiKeXu, ProKiller, VanceKK |
|            7 |     4568 | 2026-04-03 | TYLOO                | L   | 0.155      | -            | -                | -                | -         |    -0.10 | 957, Hack1ng, LaiKeXu, ProKiller, VanceKK |
|            6 |     4649 | 2026-04-02 | 100RA                | W   | 0.149      | 0.333        | 0.000 (0.000)    | 0.000 (0.000)    | 0 (0.000) |     0.95 | 957, Hack1ng, LaiKeXu, ProKiller, VanceKK |
|            5 |     4668 | 2026-04-02 | Vitalem Aerem Gaming | W   | 0.148      | 0.352        | 0.000 (0.000)    | 0.184 (0.010)    | 1 (0.148) |     2.76 | 957, Hack1ng, LaiKeXu, ProKiller, VanceKK |
|            4 |     4913 | 2026-03-30 | Lynn Vision Gaming   | L   | 0.129      | -            | -                | -                | -         |    -0.10 | 957, Hack1ng, LaiKeXu, ProKiller, VanceKK |
|            3 |     4923 | 2026-03-30 | Vitalem Aerem Gaming | W   | 0.128      | 0.352        | 0.000 (0.000)    | 0.184 (0.008)    | 1 (0.128) |     2.41 | 957, Hack1ng, LaiKeXu, ProKiller, VanceKK |
|            2 |     5459 | 2026-03-21 | Haunted House        | L   | 0.070      | -            | -                | -                | -         |    -0.96 | 957, Hack1ng, LaiKeXu, ProKiller, VanceKK |
|            1 |     5516 | 2026-03-20 | 5star eSports        | L   | 0.063      | -            | -                | -                | -         |    -0.44 | 957, Hack1ng, LaiKeXu, ProKiller, VanceKK |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($245.73)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-04-05 |      0.169 | $1,453.00      | $245.73         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
