### Roster Details<br />
Team Name: Ex-Team Aether<br />
Roster: bezymecc, brett, H0NeST, s3rum, xaler<br />
Global Rank: [239](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Americas]( ../../standings_americas_2026_09_06.md)<br />
Regional Rank: [53]( ../../standings_americas_2026_09_06.md)<br />
<br />
Final Rank Value:  658.1<br />
<br />
Final Rank Value (658.1) = Starting Rank Value (633.5) + Head To Head Adjustments (24.6)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.270[<sup>1</sup>](#table2)
- Bounty Collected: 0.215[<sup>2</sup>](#table1)
- Opponent Network: 0.006[<sup>2</sup>](#table1)
- LAN Wins: 0.000[<sup>2</sup>](#table1)

The average of these factors is 0.123<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 633.5
- 400 + ( ( 0.123 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 633.5


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.070
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent               | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                                   |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            9 |     2801 | 2026-05-24 | SportsBetExpert        | L   | 0.499      | -            | -                | -                | -         |    -0.95 | Andrew, bezymecc, H0NeST, kAAdory, s3rum |
|            8 |     2803 | 2026-05-24 | Overtake Sector        | W   | 0.498      | 0.278        | 0.008 (0.001)    | 0.241 (0.033)    | 0 (0.000) |     8.67 | Andrew, bezymecc, H0NeST, kAAdory, s3rum |
|            7 |     3448 | 2026-05-03 | Wildcard               | L   | 0.358      | -            | -                | -                | -         |    -0.77 | bezymecc, brett, H0NeST, s3rum, xaler    |
|            6 |     3528 | 2026-05-01 | BOSS                   | W   | 0.346      | 0.354        | 0.000 (0.000)    | 0.056 (0.007)    | 0 (0.000) |     5.55 | bezymecc, brett, H0NeST, s3rum, xaler    |
|            5 |     3665 | 2026-04-28 | Fisher College         | L   | 0.326      | -            | -                | -                | -         |    -2.83 | bezymecc, brett, H0NeST, s3rum, xaler    |
|            4 |     3669 | 2026-04-28 | FarmVille              | W   | 0.325      | 0.354        | 0.001 (0.000)    | 0.089 (0.010)    | 0 (0.000) |     5.24 | bezymecc, brett, H0NeST, s3rum, xaler    |
|            3 |     3701 | 2026-04-27 | Wildcard               | L   | 0.319      | -            | -                | -                | -         |    -0.68 | bezymecc, brett, H0NeST, s3rum, xaler    |
|            2 |     3709 | 2026-04-27 | Shimmer                | W   | 0.318      | 0.354        | 0.008 (0.001)    | 0.043 (0.005)    | 0 (0.000) |     5.43 | bezymecc, brett, H0NeST, s3rum, xaler    |
|            1 |     3749 | 2026-04-26 | EMPIRE (American team) | W   | 0.313      | 0.363        | 0.000 (0.000)    | 0.046 (0.005)    | 0 (0.000) |     4.91 | bezymecc, brett, H0NeST, s3rum, xaler    |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($1,004.16)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-05-24 |      0.499 | $750.00        | $374.24         |
| 2026-05-03 |      0.360 | $1,750.00      | $629.92         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
