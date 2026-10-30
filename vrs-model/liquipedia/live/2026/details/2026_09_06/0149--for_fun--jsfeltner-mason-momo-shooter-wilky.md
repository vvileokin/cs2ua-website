### Roster Details<br />
Team Name: For Fun<br />
Roster: jsfeltner, mason, Momo, Shooter, Wilky<br />
Global Rank: [149](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Americas]( ../../standings_americas_2026_09_06.md)<br />
Regional Rank: [27]( ../../standings_americas_2026_09_06.md)<br />
<br />
Final Rank Value:  806.6<br />
<br />
Final Rank Value (806.6) = Starting Rank Value (793.8) + Head To Head Adjustments (12.7)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.259[<sup>1</sup>](#table2)
- Bounty Collected: 0.221[<sup>2</sup>](#table1)
- Opponent Network: 0.013[<sup>2</sup>](#table1)
- LAN Wins: 0.336[<sup>2</sup>](#table1)

The average of these factors is 0.207<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 793.8
- 400 + ( ( 0.207 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 793.8


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.117
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent        | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                 |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            5 |      231 | 2026-08-30 | SportsBetExpert | L   | 1.000      | -            | -                | -                | -         |    -5.48 | jsfeltner, mason, Momo, Shooter, Wilky |
|            4 |      247 | 2026-08-30 | Wanted Goons    | W   | 1.000      | 0.333        | 0.000 (0.000)    | 0.084 (0.028)    | 1 (1.000) |     9.48 | jsfeltner, mason, Momo, Shooter, Wilky |
|            3 |      287 | 2026-08-29 | Regain          | W   | 1.000      | 0.333        | 0.009 (0.003)    | 0.306 (0.102)    | 1 (1.000) |    14.85 | jsfeltner, mason, Momo, Shooter, Wilky |
|            2 |      290 | 2026-08-29 | KODEX Esports   | W   | 1.000      | 0.333        | 0.000 (0.000)    | 0.000 (0.000)    | 1 (1.000) |     3.22 | jsfeltner, mason, Momo, Shooter, Wilky |
|            1 |      297 | 2026-08-29 | Life's A Game   | L   | 1.000      | -            | -                | -                | -         |    -9.34 | jsfeltner, mason, Momo, Shooter, Wilky |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($700.00)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-08-30 |      1.000 | $700.00        | $700.00         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
