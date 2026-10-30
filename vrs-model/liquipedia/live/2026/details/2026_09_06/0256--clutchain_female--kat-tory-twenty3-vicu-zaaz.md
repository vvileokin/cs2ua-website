### Roster Details<br />
Team Name: Clutchain Female<br />
Roster: Kat, tory, twenty3, vicu, zAAz<br />
Global Rank: [256](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [172]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  644.8<br />
<br />
Final Rank Value (644.8) = Starting Rank Value (667.1) + Head To Head Adjustments (-22.3)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.290[<sup>1</sup>](#table2)
- Bounty Collected: 0.192[<sup>2</sup>](#table1)
- Opponent Network: 0.000[<sup>2</sup>](#table1)
- LAN Wins: 0.080[<sup>2</sup>](#table1)

The average of these factors is 0.140<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 667.1
- 400 + ( ( 0.140 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 667.1


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.044
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent                | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                            |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           14 |     2006 | 2026-06-26 | Atrix Esports           | W   | 0.716      | 0.393        | 0.002 (0.001)    | 0.003 (0.001)    | 1 (0.716) |    10.17 | Kat, tory, twenty3, vicu, zAAz    |
|           13 |     2015 | 2026-06-25 | MIBR Female             | L   | 0.712      | -            | -                | -                | -         |    -8.08 | Kat, tory, twenty3, vicu, zAAz    |
|           12 |     3419 | 2026-05-05 | Privateer Gaming        | L   | 0.369      | -            | -                | -                | -         |    -4.53 | Kat, tory, twenty3, vicu, zAAz    |
|           11 |     3503 | 2026-05-02 | Players (European team) | L   | 0.350      | -            | -                | -                | -         |    -7.88 | Kat, tory, twenty3, vicu, zAAz    |
|           10 |     3619 | 2026-04-30 | HYPERSPIRIT             | L   | 0.335      | -            | -                | -                | -         |    -3.87 | Kat, tory, twenty3, vicu, zAAz    |
|            9 |     3656 | 2026-04-29 | ASTRAL Esports          | L   | 0.329      | -            | -                | -                | -         |    -0.56 | Kat, tory, twenty3, vicu, zAAz    |
|            8 |     3988 | 2026-04-22 | Lilmix                  | L   | 0.283      | -            | -                | -                | -         |    -3.77 | Kat, tory, twenty3, vicu, zAAz    |
|            7 |     4007 | 2026-04-21 | EC BANGA                | W   | 0.276      | 0.303        | 0.000 (0.000)    | 0.029 (0.002)    | 0 (0.000) |     2.35 | Kat, tory, twenty3, vicu, zAAz    |
|            6 |     4067 | 2026-04-18 | Atreides                | L   | 0.256      | -            | -                | -                | -         |    -2.69 | Kat, tory, twenty3, vicu, zAAz    |
|            5 |     4620 | 2026-04-02 | HEROIC Academy          | L   | 0.151      | -            | -                | -                | -         |    -2.26 | Kat, tory, twenty3, vicu, zAAz    |
|            4 |     4732 | 2026-04-01 | KAJO                    | W   | 0.143      | 0.384        | 0.000 (0.000)    | 0.005 (0.000)    | 0 (0.000) |     0.83 | Kat, tory, twenty3, vicu, zAAz    |
|            3 |     4910 | 2026-03-30 | Privateer Gaming        | L   | 0.129      | -            | -                | -                | -         |    -1.54 | Kat, tory, twenty3, vicu, zAAz    |
|            2 |     5592 | 2026-03-18 | Ex-Zero Tenacity        | L   | 0.051      | -            | -                | -                | -         |    -0.31 | Kat, tory, twenty3, vicu, wieenN- |
|            1 |     5684 | 2026-03-16 | The Last Resort         | L   | 0.037      | -            | -                | -                | -         |    -0.18 | Kat, tory, twenty3, vicu, wieenN- |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($1,795.08)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-06-26 |      0.717 | $2,502.26      | $1,795.08       |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
