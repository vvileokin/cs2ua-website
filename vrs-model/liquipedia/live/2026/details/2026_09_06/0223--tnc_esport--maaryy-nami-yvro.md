### Roster Details<br />
Team Name: TNC Esport<br />
Roster: maaryy, Nami, yvro<br />
Global Rank: [223](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [153]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  676.4<br />
<br />
Final Rank Value (676.4) = Starting Rank Value (642.6) + Head To Head Adjustments (33.8)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.266[<sup>1</sup>](#table2)
- Bounty Collected: 0.221[<sup>2</sup>](#table1)
- Opponent Network: 0.023[<sup>2</sup>](#table1)
- LAN Wins: 0.000[<sup>2</sup>](#table1)

The average of these factors is 0.128<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 642.6
- 400 + ( ( 0.128 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 642.6


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.060
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent               | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                            |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|            5 |     3181 | 2026-05-13 | Betclic Apogee Esports | W   | 0.424      | 0.384        | 0.004 (0.001)    | 0.179 (0.029)    | 0 (0.000) |     8.96 | aimy, maaryy, Markoś, Nami, yvro  |
|            4 |     3358 | 2026-05-08 | FAVBET Team            | W   | 0.391      | 0.384        | 0.001 (0.000)    | 0.071 (0.011)    | 0 (0.000) |     6.49 | aimy, maaryy, Markoś, Nami, yvro  |
|            3 |     3406 | 2026-05-06 | Lavked                 | W   | 0.375      | 0.384        | 0.010 (0.001)    | 0.833 (0.120)    | 0 (0.000) |     9.69 | aimy, maaryy, Markoś, Nami, yvro  |
|            2 |     3439 | 2026-05-04 | UNiTY esports          | W   | 0.362      | 0.384        | 0.006 (0.001)    | 0.537 (0.075)    | 0 (0.000) |     9.51 | AdrieN, maaryy, Nami, POLO, yvro  |
|            1 |     4367 | 2026-04-05 | ARGOS                  | L   | 0.171      | -            | -                | -                | -         |    -0.82 | AdrieN, dixyi, maaryy, Nami, yvro |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($891.35)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-05-15 |      0.437 | $1,250.00      | $546.30         |
| 2026-04-09 |      0.197 | $1,750.00      | $345.06         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
