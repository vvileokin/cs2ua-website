### Roster Details<br />
Team Name: Team Tricksters<br />
Roster: Halfjix, iRV1NG, Rodos1k<br />
Global Rank: [339](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [216]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  521.2<br />
<br />
Final Rank Value (521.2) = Starting Rank Value (529.3) + Head To Head Adjustments (-8.1)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.271[<sup>1</sup>](#table2)
- Bounty Collected: 0.000[<sup>2</sup>](#table1)
- Opponent Network: 0.001[<sup>2</sup>](#table1)
- LAN Wins: 0.000[<sup>2</sup>](#table1)

The average of these factors is 0.068<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 529.3
- 400 + ( ( 0.068 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 529.3


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.032
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent               | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                       |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            5 |      320 | 2026-08-29 | DONSTU Esports         | L   | 1.000      | -            | -                | -                | -         |    -8.10 | Halfjix, iRV1NG, Leowaron, rmboo0_o, Rodos1k |
|            4 |     1730 | 2026-07-12 | Mellren                | L   | 0.823      | -            | -                | -                | -         |    -6.21 | Halfjix, iRV1NG, k3lpi, L1GHTN, Rodos1k      |
|            3 |     1751 | 2026-07-11 | TheBoys (Russian team) | W   | 0.818      | 0.278        | 0.000 (0.000)    | 0.032 (0.007)    | 0 (0.000) |     8.56 | Halfjix, iRV1NG, k3lpi, L1GHTN, Rodos1k      |
|            2 |     2765 | 2026-05-25 | ARGOS                  | L   | 0.504      | -            | -                | -                | -         |    -1.79 | adaRAN, boq, Halfjix, iRV1NG, Rodos1k        |
|            1 |     2773 | 2026-05-25 | WW TEAM                | L   | 0.504      | -            | -                | -                | -         |    -0.58 | adaRAN, boq, Halfjix, iRV1NG, Rodos1k        |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($1,051.56)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-08-30 |      1.000 | $639.44        | $639.44         |
| 2026-07-12 |      0.824 | $500.00        | $412.12         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
