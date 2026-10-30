### Roster Details<br />
Team Name: Mai tai<br />
Roster: aimy, chudy, Nami, next1me, Pelle<br />
Global Rank: [184](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [130]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  730.6<br />
<br />
Final Rank Value (730.6) = Starting Rank Value (679.0) + Head To Head Adjustments (51.6)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.235[<sup>1</sup>](#table2)
- Bounty Collected: 0.265[<sup>2</sup>](#table1)
- Opponent Network: 0.087[<sup>2</sup>](#table1)
- LAN Wins: 0.000[<sup>2</sup>](#table1)

The average of these factors is 0.147<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 679.0
- 400 + ( ( 0.147 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 679.0


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.219
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent         | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                              |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           18 |     1378 | 2026-07-26 | Misa Esports     | W   | 0.916      | 0.344        | 0.001 (0.000)    | 0.643 (0.203)    | 0 (0.000) |    14.95 | chudy, Melavi, Nami, Pelle, wazak   |
|           17 |     1914 | 2026-07-01 | DONSTU Esports   | L   | 0.749      | -            | -                | -                | -         |    -9.87 | chudy, Maze, Melavi, Nami, tomiko   |
|           16 |     1944 | 2026-06-29 | Entropy Gaming   | L   | 0.736      | -            | -                | -                | -         |   -13.27 | chudy, Maze, Melavi, Nami, tomiko   |
|           15 |     1991 | 2026-06-27 | Megoshort        | W   | 0.723      | 0.303        | 0.002 (0.000)    | 0.191 (0.042)    | 0 (0.000) |    10.23 | aimy, chudy, Melavi, Nami, tomiko   |
|           14 |     2377 | 2026-06-07 | ENCE             | W   | 0.588      | 0.344        | 0.012 (0.003)    | 0.515 (0.104)    | 0 (0.000) |    14.03 | aimy, chudy, Nami, next1me, Pelle   |
|           13 |     2505 | 2026-06-02 | Atreides         | W   | 0.555      | 0.333        | 0.001 (0.000)    | 0.536 (0.099)    | 0 (0.000) |    11.80 | aimy, chudy, Nami, next1me, Pelle   |
|           12 |     2677 | 2026-05-28 | Drip Too Hard    | L   | 0.522      | -            | -                | -                | -         |    -8.12 | aimy, chudy, Nami, next1me, Pelle   |
|           11 |     2692 | 2026-05-27 | White tigers     | W   | 0.517      | 0.307        | 0.000 (0.000)    | 0.000 (0.000)    | 0 (0.000) |     2.44 | aimy, chudy, Nami, next1me, Pelle   |
|           10 |     2703 | 2026-05-27 | Honvéd Esport    | L   | 0.516      | -            | -                | -                | -         |    -5.19 | aimy, chudy, Nami, next1me, Pelle   |
|            9 |     2712 | 2026-05-27 | DONSTU Esports   | W   | 0.516      | 0.333        | 0.004 (0.001)    | 0.453 (0.078)    | 0 (0.000) |    10.32 | aimy, chudy, Nami, next1me, Pelle   |
|            8 |     2721 | 2026-05-27 | ASTRAL Esports   | L   | 0.515      | -            | -                | -                | -         |    -1.69 | aimy, chudy, Nami, next1me, Pelle   |
|            7 |     2746 | 2026-05-26 | Wampirki         | W   | 0.510      | 0.303        | 0.000 (0.000)    | 0.120 (0.019)    | 0 (0.000) |     4.31 | aimy, chudy, Nami, next1me, Pelle   |
|            6 |     2758 | 2026-05-26 | Falcons Force    | W   | 0.508      | 0.384        | 0.000 (0.000)    | 0.223 (0.044)    | 0 (0.000) |     8.45 | aimy, chudy, Nami, next1me, Pelle   |
|            5 |     2785 | 2026-05-25 | ASTRAL Esports   | L   | 0.502      | -            | -                | -                | -         |    -1.44 | aimy, chudy, Nami, next1me, Pelle   |
|            4 |     2823 | 2026-05-24 | GenOne           | W   | 0.496      | 0.333        | 0.055 (0.009)    | 1.000 (0.165)    | 0 (0.000) |    13.56 | aimy, chudy, Nami, next1me, Pelle   |
|            3 |     3870 | 2026-04-25 | UPGRADE Team     | L   | 0.303      | -            | -                | -                | -         |    -1.09 | aimy, chudy, Melavi, next1me, Pelle |
|            2 |     3909 | 2026-04-24 | Ex-Zero Tenacity | W   | 0.297      | 0.384        | 0.031 (0.004)    | 1.000 (0.114)    | 0 (0.000) |     7.31 | aimy, chudy, Melavi, next1me, Pelle |
|            1 |     3978 | 2026-04-22 | NNP              | L   | 0.284      | -            | -                | -                | -         |    -5.17 | aimy, chudy, Melavi, next1me, Pelle |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($287.29)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-05-28 |      0.524 | $548.00        | $287.29         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
