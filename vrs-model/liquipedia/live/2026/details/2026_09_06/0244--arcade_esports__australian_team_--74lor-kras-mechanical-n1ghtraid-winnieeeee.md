### Roster Details<br />
Team Name: Arcade Esports (Australian team)<br />
Roster: 74LOR, Kras, Mechanical, N1ghtraid, Winnieeeee<br />
Global Rank: [244](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Asia]( ../../standings_asia_2026_09_06.md)<br />
Regional Rank: [25]( ../../standings_asia_2026_09_06.md)<br />
<br />
Final Rank Value:  653.9<br />
<br />
Final Rank Value (653.9) = Starting Rank Value (660.5) + Head To Head Adjustments (-6.6)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.202[<sup>1</sup>](#table2)
- Bounty Collected: 0.220[<sup>2</sup>](#table1)
- Opponent Network: 0.017[<sup>2</sup>](#table1)
- LAN Wins: 0.109[<sup>2</sup>](#table1)

The average of these factors is 0.137<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 660.5
- 400 + ( ( 0.137 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 660.5


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.177
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent                    | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                         |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           29 |      217 | 2026-08-31 | Ground Zero Gaming          | L   | 1.000      | -            | -                | -                | -         |    -5.63 | 74LOR, Jynx, Kras, Mechanical, N1ghtraid       |
|           28 |      282 | 2026-08-30 | Rooster                     | W   | 1.000      | 0.278        | 0.006 (0.002)    | 0.275 (0.076)    | 0 (0.000) |    19.58 | 74LOR, Jynx, Kras, Mechanical, N1ghtraid       |
|           27 |      333 | 2026-08-29 | Mindfreak (Australian team) | W   | 1.000      | 0.278        | 0.003 (0.001)    | 0.212 (0.059)    | 0 (0.000) |    20.11 | Jynx, Kras, Mechanical, N1ghtraid, RoyaL       |
|           26 |      476 | 2026-08-26 | Mindfreak (Australian team) | L   | 1.000      | -            | -                | -                | -         |   -10.80 | 74LOR, Jynx, Kras, Mechanical, N1ghtraid       |
|           25 |     1011 | 2026-08-07 | Team Abyssal                | L   | 0.995      | -            | -                | -                | -         |   -14.16 | 74LOR, Kras, Mechanical, N1ghtraid, Winnieeeee |
|           24 |     1042 | 2026-08-06 | Time Waves                  | W   | 0.989      | 0.305        | 0.000 (0.000)    | 0.000 (0.000)    | 0 (0.000) |     6.26 | 74LOR, Kras, Mechanical, N1ghtraid, Winnieeeee |
|           23 |     1064 | 2026-08-05 | Team Abyssal                | L   | 0.982      | -            | -                | -                | -         |   -14.70 | 74LOR, Kras, Mechanical, N1ghtraid, Winnieeeee |
|           22 |     1633 | 2026-07-17 | Ground Zero Gaming          | L   | 0.855      | -            | -                | -                | -         |    -5.40 | 74LOR, Kras, Mechanical, N1ghtraid, Winnieeeee |
|           21 |     1638 | 2026-07-17 | Orgless (Australian team)   | W   | 0.855      | 0.317        | 0.001 (0.000)    | 0.089 (0.024)    | 1 (0.855) |    11.41 | 74LOR, Kras, Mechanical, N1ghtraid, Winnieeeee |
|           20 |     1642 | 2026-07-16 | Ground Zero Gaming          | L   | 0.854      | -            | -                | -                | -         |    -5.24 | 74LOR, Kras, Mechanical, N1ghtraid, Winnieeeee |
|           19 |     4198 | 2026-04-11 | Orgless (Australian team)   | L   | 0.208      | -            | -                | -                | -         |    -3.75 | 74LOR, Jynx, Kras, Mechanical, N1ghtraid       |
|           18 |     4202 | 2026-04-10 | Team Abyssal                | L   | 0.207      | -            | -                | -                | -         |    -3.11 | 74LOR, Jynx, Kras, Mechanical, N1ghtraid       |
|           17 |     4204 | 2026-04-10 | MGLBROS                     | W   | 0.206      | 0.306        | 0.000 (0.000)    | -                | 0 (0.000) |     1.24 | 74LOR, Jynx, Kras, Mechanical, N1ghtraid       |
|           16 |     4310 | 2026-04-07 | Rooster                     | L   | 0.182      | -            | -                | -                | -         |    -2.09 | 74LOR, Jynx, Kras, Mechanical, N1ghtraid       |
|           15 |     4346 | 2026-04-06 | Mindfreak (Australian team) | W   | 0.175      | 0.278        | 0.000 (0.000)    | 0.011 (0.001)    | 0 (0.000) |     2.05 | 74LOR, Jynx, Kras, Mechanical, N1ghtraid       |
|           14 |     4402 | 2026-04-05 | Time Waves                  | W   | 0.168      | 0.278        | 0.000 (0.000)    | 0.014 (0.001)    | -         |     1.02 | 74LOR, Jynx, Kras, Mechanical, N1ghtraid       |
|           13 |     4565 | 2026-04-03 | Team Abyssal                | L   | 0.155      | -            | -                | -                | -         |    -2.35 | 74LOR, Jynx, Kras, Mechanical, N1ghtraid       |
|           12 |     5283 | 2026-03-24 | Rooster                     | L   | 0.089      | -            | -                | -                | -         |    -1.03 | 74LOR, Jynx, Kras, Mechanical, N1ghtraid       |
|           11 |     5361 | 2026-03-23 | Muttley Crew                | W   | 0.082      | 0.278        | -                | 0.005 (0.000)    | -         |     0.49 | 74LOR, Jynx, Kras, Mechanical, N1ghtraid       |
|           10 |     5467 | 2026-03-21 | Rooster                     | L   | 0.069      | -            | -                | -                | -         |    -0.80 | 74LOR, Jynx, Kras, Mechanical, N1ghtraid       |
|            9 |     5665 | 2026-03-16 | SemperFi Esports            | L   | 0.040      | -            | -                | -                | -         |    -0.60 | 74LOR, Jynx, Kras, Mechanical, N1ghtraid       |
|            8 |     5668 | 2026-03-16 | Ground Zero Gaming          | W   | 0.039      | 0.327        | 0.014 (0.000)    | 0.375 (0.005)    | 1 (0.039) |     1.01 | 74LOR, Jynx, Kras, Mechanical, N1ghtraid       |
|            7 |     5671 | 2026-03-16 | THUNDERdOWNUNDER            | L   | 0.039      | -            | -                | -                | -         |    -0.14 | 74LOR, Jynx, Kras, Mechanical, N1ghtraid       |
|            6 |     5701 | 2026-03-16 | Mindfreak (Australian team) | W   | 0.035      | 0.327        | 0.000 (0.000)    | 0.011 (0.000)    | 1 (0.035) |     0.41 | 74LOR, Jynx, Kras, Mechanical, N1ghtraid       |
|            5 |     5710 | 2026-03-15 | Team Abyssal                | W   | 0.033      | 0.327        | 0.004 (0.000)    | 0.188 (0.002)    | 1 (0.033) |     0.54 | 74LOR, Jynx, Kras, Mechanical, N1ghtraid       |
|            4 |     5714 | 2026-03-15 | SemperFi Esports            | L   | 0.032      | -            | -                | -                | -         |    -0.48 | 74LOR, Jynx, Kras, Mechanical, N1ghtraid       |
|            3 |     5842 | 2026-03-12 | Mindfreak (Australian team) | L   | 0.014      | -            | -                | -                | -         |    -0.28 | 74LOR, Jynx, Kras, Mechanical, N1ghtraid       |
|            2 |     5843 | 2026-03-12 | Skele                       | W   | 0.014      | -            | -                | -                | 1 (0.014) |     0.08 | 74LOR, Jynx, Kras, Mechanical, N1ghtraid       |
|            1 |     5845 | 2026-03-12 | Mindfreak (Australian team) | L   | 0.013      | -            | -                | -                | -         |    -0.25 | 74LOR, Jynx, Kras, Mechanical, N1ghtraid       |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($58.22)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-03-17 |      0.041 | $1,413.00      | $58.22          |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
