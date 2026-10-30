### Roster Details<br />
Team Name: Leo Team<br />
Roster: aimy, drac, leen, next1me, Tarkky<br />
Global Rank: [114](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [87]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  881.9<br />
<br />
Final Rank Value (881.9) = Starting Rank Value (914.5) + Head To Head Adjustments (-32.6)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.273[<sup>1</sup>](#table2)
- Bounty Collected: 0.293[<sup>2</sup>](#table1)
- Opponent Network: 0.189[<sup>2</sup>](#table1)
- LAN Wins: 0.327[<sup>2</sup>](#table1)

The average of these factors is 0.271<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 914.5
- 400 + ( ( 0.271 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 914.5


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.421
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent                 | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                 |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           23 |      366 | 2026-08-28 | Phantom Esports          | L   | 1.000      | -            | -                | -                | -         |    -7.49 | aimy, drac, leen, next1me, Tarkky      |
|           22 |      412 | 2026-08-27 | Butterfly (Russian team) | L   | 1.000      | -            | -                | -                | -         |    -8.58 | aimy, drac, leen, next1me, Tarkky      |
|           21 |      518 | 2026-08-25 | IC Academy               | L   | 1.000      | -            | -                | -                | -         |   -18.23 | aimy, drac, leen, next1me, Tarkky      |
|           20 |      519 | 2026-08-25 | UNiTY esports            | W   | 1.000      | 0.384        | 0.006 (0.002)    | 0.537 (0.206)    | 0 (0.000) |    16.72 | aimy, drac, leen, next1me, Tarkky      |
|           19 |      541 | 2026-08-24 | GenOne                   | W   | 1.000      | 0.435        | 0.055 (0.024)    | 1.000 (0.435)    | 0 (0.000) |    24.10 | aimy, drac, leen, next1me, Tarkky      |
|           18 |      590 | 2026-08-22 | HAVU                     | W   | 1.000      | 0.384        | 0.004 (0.002)    | 0.375 (0.144)    | 0 (0.000) |    15.52 | aimy, drac, leen, next1me, Tarkky      |
|           17 |      609 | 2026-08-21 | SPARTA Esports           | L   | 1.000      | -            | -                | -                | -         |   -13.89 | aimy, drac, leen, next1me, Tarkky      |
|           16 |      633 | 2026-08-20 | Bushido Wildcats         | W   | 1.000      | 0.384        | 0.017 (0.007)    | 1.000 (0.384)    | 0 (0.000) |    19.07 | aimy, drac, leen, next1me, Tarkky      |
|           15 |      691 | 2026-08-18 | Ex-RUSTEC                | L   | 1.000      | -            | -                | -                | -         |   -11.83 | aimy, drac, leen, next1me, Tarkky      |
|           14 |      773 | 2026-08-15 | Misa Esports             | L   | 1.000      | -            | -                | -                | -         |   -20.52 | aimy, leen, next1me, OneUn1que, Tarkky |
|           13 |      797 | 2026-08-14 | Benched gods             | W   | 1.000      | 0.317        | 0.000 (0.000)    | 0.437 (0.139)    | 0 (0.000) |    10.57 | aimy, drac, leen, next1me, Tarkky      |
|           12 |      812 | 2026-08-14 | Misa Esports             | L   | 1.000      | -            | -                | -                | -         |   -22.62 | aimy, drac, leen, next1me, Tarkky      |
|           11 |     1071 | 2026-08-04 | BASEMENT BOYS            | L   | 0.977      | -            | -                | -                | -         |   -11.23 | aimy, drac, leen, next1me, Tarkky      |
|           10 |     1081 | 2026-08-04 | Bushido Wildcats         | L   | 0.976      | -            | -                | -                | -         |   -15.67 | aimy, drac, leen, next1me, Tarkky      |
|            9 |     1096 | 2026-08-03 | WhiteBIT Academy         | W   | 0.971      | 0.317        | 0.008 (0.002)    | 0.539 (0.166)    | 0 (0.000) |    10.89 | aimy, drac, leen, next1me, Tarkky      |
|            8 |     1105 | 2026-08-03 | IC Academy               | W   | 0.969      | 0.317        | 0.007 (0.002)    | 0.744 (0.228)    | -         |    10.24 | aimy, drac, leen, next1me, Tarkky      |
|            7 |     1126 | 2026-08-02 | ILLYRIANS (Kosovar team) | L   | 0.964      | -            | -                | -                | -         |   -23.18 | aimy, drac, leen, next1me, Tarkky      |
|            6 |     1141 | 2026-08-02 | Vexar                    | W   | 0.963      | 0.317        | 0.001 (0.000)    | 0.477 (0.146)    | -         |     9.30 | aimy, drac, leen, next1me, Tarkky      |
|            5 |     1939 | 2026-06-29 | ASTRAL Esports           | L   | 0.737      | -            | -                | -                | -         |    -8.08 | aimy, amster, kL1o, leen, next1me      |
|            4 |     1945 | 2026-06-29 | Esport BERG              | W   | 0.736      | 0.303        | 0.001 (0.000)    | 0.124 (0.028)    | 1 (0.736) |     7.83 | aimy, amster, kL1o, leen, next1me      |
|            3 |     1972 | 2026-06-28 | GAMEHARMONY              | W   | 0.729      | 0.303        | 0.000 (0.000)    | -                | 1 (0.729) |     1.11 | aimy, amster, kL1o, leen, next1me      |
|            2 |     1974 | 2026-06-28 | Coalesce                 | W   | 0.729      | 0.303        | -                | 0.057 (0.013)    | 1 (0.729) |     1.89 | aimy, amster, kL1o, leen, next1me      |
|            1 |     1976 | 2026-06-28 | Aimhaus                  | W   | 0.729      | -            | -                | -                | 1 (0.729) |     1.46 | aimy, amster, kL1o, leen, next1me      |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($1,105.35)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-06-29 |      0.737 | $1,500.00      | $1,105.35       |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
