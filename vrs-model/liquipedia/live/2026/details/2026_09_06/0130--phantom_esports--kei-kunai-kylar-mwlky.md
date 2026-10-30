### Roster Details<br />
Team Name: Phantom Esports<br />
Roster: KEi, Kunai, Kylar, mwlky<br />
Global Rank: [130](../../standings_global_2026_09_06.md)<br />
<br />
Region: [Europe]( ../../standings_europe_2026_09_06.md)<br />
Regional Rank: [100]( ../../standings_europe_2026_09_06.md)<br />
<br />
Final Rank Value:  839.4<br />
<br />
Final Rank Value (839.4) = Starting Rank Value (775.9) + Head To Head Adjustments (63.5)<br />

#### Starting Rank Value<br />
To figure out a rosters's Starting Rank Value, first take the average of these four factors:<br />
- Bounty Offered: 0.267[<sup>1</sup>](#table2)
- Bounty Collected: 0.324[<sup>2</sup>](#table1)
- Opponent Network: 0.099[<sup>2</sup>](#table1)
- LAN Wins: 0.100[<sup>2</sup>](#table1)

The average of these factors is 0.198<br />
<br />
Next, take the maximum and minimum average across all teams and compute the following:<br />
- 400 + ( ( Roster_Average - Min_Average ) / ( Max_Average - Min_Average ) ) * 1600 = 775.9
- 400 + ( ( 0.198 - 0.000 ) / ( 0.842 - 0.000 ) ) * 1600 = 775.9


#### Factors<br />
Below you can see a table of all of the matches that contributed to this roster's Final Rank Value.<br />
Note:<br />

- For Bounty Collected, Opponent Network, and LAN Wins, we consider only the ten best results over the past 6 months.
- Raw values for those factors are multiplied by Age Weight. Bounty and Opponent Network values are also multiplied by Event Weight. The adjusted value is shown in parenthesis.
- The final value for a factor is the total of its adjusted values divided by 10. Bounty Collected is further scaled by the curve function[<sup>3</sup>](#curveFunction)
- Head to head adjustments are based on rosters' starting rank values. The results shown below are adjusted by Age Weight and not Event Weight

- A team offers ownNetwork for other teams to collect for their network
- Own Network: 0.168
<span id="table1"></span><br />


| Match Played | Match ID | Date       | Opponent                 | W/L | Age Weight | Event Weight | Bounty Collected | Opponent Network | LAN Wins  | H2H Adj. | Roster                            |
| -: | -: | :- | :- | :- | :- | :- | :- | :- | :- | -: | :- |
|           35 |     2076 | 2026-06-21 | FOKUS                    | W   | 0.683      | 0.435        | 0.116 (0.034)    | 0.527 (0.156)    | 0 (0.000) |    19.22 | Altekz, Kunai, Kylar, mwlky, TMB  |
|           34 |     2085 | 2026-06-20 | Walczaki                 | W   | 0.677      | 0.435        | 0.064 (0.019)    | 0.799 (0.235)    | 0 (0.000) |    18.43 | Altekz, Kunai, Kylar, mwlky, TMB  |
|           33 |     3391 | 2026-05-06 | Permitta Esports         | L   | 0.377      | -            | -                | -                | -         |    -5.95 | Ayteel, KEi, Kunai, Kylar, mwlky  |
|           32 |     3421 | 2026-05-05 | GenOne                   | W   | 0.368      | 0.384        | 0.055 (0.008)    | 1.000 (0.141)    | -         |     9.22 | aimy, KEi, Kunai, Kylar, mwlky    |
|           31 |     3430 | 2026-05-04 | Lavked                   | L   | 0.363      | -            | -                | -                | -         |    -3.78 | aimy, KEi, Kunai, Kylar, mwlky    |
|           30 |     3458 | 2026-05-03 | Ex-against All authority | W   | 0.356      | 0.384        | 0.002 (0.000)    | 0.106 (0.015)    | -         |     4.38 | aimy, KEi, Kunai, Kylar, mwlky    |
|           29 |     3592 | 2026-04-30 | Fnatic                   | L   | 0.337      | -            | -                | -                | -         |    -0.44 | KEi, Kunai, Kylar, lunAtic, mwlky |
|           28 |     3643 | 2026-04-29 | GenOne                   | W   | 0.331      | 0.384        | 0.055 (0.007)    | 1.000 (0.127)    | -         |     8.56 | KEi, Kunai, Kylar, lunAtic, mwlky |
|           27 |     3683 | 2026-04-28 | Ex-against All authority | W   | 0.324      | -            | -                | -                | -         |     4.17 | KEi, Kunai, Kylar, lunAtic, mwlky |
|           26 |     3727 | 2026-04-27 | The Last Resort          | W   | 0.317      | 0.384        | 0.011 (0.001)    | 0.447 (0.055)    | -         |     7.21 | KEi, Kunai, Kylar, lunAtic, mwlky |
|           25 |     3781 | 2026-04-26 | Ex-RUSTEC                | W   | 0.311      | 0.384        | 0.018 (0.002)    | 0.911 (0.109)    | -         |     7.52 | KEi, Kunai, Kylar, lunAtic, mwlky |
|           24 |     3860 | 2026-04-25 | Hashiras                 | L   | 0.304      | -            | -                | -                | -         |    -5.88 | KEi, Kunai, Kylar, lunAtic, mwlky |
|           23 |     3964 | 2026-04-23 | Atreides                 | W   | 0.289      | 0.384        | -                | 0.536 (0.060)    | -         |     4.78 | KEi, Kunai, Kylar, lunAtic, mwlky |
|           22 |     4061 | 2026-04-18 | FAVBET Team              | L   | 0.257      | -            | -                | -                | -         |    -5.37 | KEi, Kunai, Kylar, mwlky, mynio   |
|           21 |     4090 | 2026-04-16 | GenOne                   | L   | 0.244      | -            | -                | -                | -         |    -1.23 | KEi, Kunai, Kylar, mwlky, mynio   |
|           20 |     4112 | 2026-04-15 | Lavked                   | L   | 0.235      | -            | -                | -                | -         |    -2.52 | KEi, Kunai, Kylar, mwlky, mynio   |
|           19 |     4126 | 2026-04-14 | Ex-RUBY                  | L   | 0.230      | -            | -                | -                | -         |    -4.76 | KEi, Kunai, Kylar, mwlky, mynio   |
|           18 |     4130 | 2026-04-14 | Metizport                | L   | 0.229      | -            | -                | -                | -         |    -1.23 | KEi, Kunai, Kylar, mwlky, mynio   |
|           17 |     4149 | 2026-04-13 | HEROIC Academy           | W   | 0.221      | -            | -                | -                | -         |     2.58 | KEi, Kunai, Kylar, mwlky, mynio   |
|           16 |     4226 | 2026-04-10 | Black Phoenix            | W   | 0.201      | 0.371        | 0.017 (0.001)    | 0.955 (0.071)    | -         |     4.10 | KEi, Kunai, Kylar, mwlky, mynio   |
|           15 |     4698 | 2026-04-01 | B8                       | L   | 0.144      | -            | -                | -                | -         |    -0.09 | KEi, Kunai, Kylar, mwlky, mynio   |
|           14 |     4743 | 2026-04-01 | AM Gaming                | W   | 0.142      | -            | -                | -                | 1 (0.142) |     1.84 | KEi, Kunai, Kylar, mwlky, mynio   |
|           13 |     4753 | 2026-04-01 | BESTIA                   | L   | 0.141      | -            | -                | -                | -         |    -1.24 | KEi, Kunai, Kylar, mwlky, mynio   |
|           12 |     4786 | 2026-03-31 | B8                       | L   | 0.138      | -            | -                | -                | -         |    -0.08 | KEi, Kunai, Kylar, mwlky, mynio   |
|           11 |     4793 | 2026-03-31 | Z7 Esports               | W   | 0.137      | -            | -                | -                | 1 (0.137) |     0.48 | KEi, Kunai, Kylar, mwlky, mynio   |
|           10 |     4810 | 2026-03-31 | Máquinas                 | W   | 0.137      | -            | -                | -                | 1 (0.137) |     0.46 | KEi, Kunai, Kylar, mwlky, mynio   |
|            9 |     4828 | 2026-03-31 | AM Gaming                | L   | 0.136      | -            | -                | -                | -         |    -2.57 | KEi, Kunai, Kylar, mwlky, mynio   |
|            8 |     4856 | 2026-03-31 | WAZABI                   | W   | 0.135      | -            | -                | -                | 1 (0.135) |     1.68 | KEi, Kunai, Kylar, mwlky, mynio   |
|            7 |     5238 | 2026-03-24 | FOKUS                    | L   | 0.092      | -            | -                | -                | -         |    -0.23 | KEi, Kunai, Kylar, mwlky, mynio   |
|            6 |     5248 | 2026-03-24 | 3DMAX                    | W   | 0.091      | 0.333        | 0.301 (0.009)    | -                | 1 (0.091) |     2.71 | KEi, Kunai, Kylar, mwlky, mynio   |
|            5 |     5285 | 2026-03-24 | ASTRAL Esports           | W   | 0.088      | 0.333        | 0.010 (0.000)    | 0.773 (0.023)    | 1 (0.088) |     2.54 | KEi, Kunai, Kylar, mwlky, mynio   |
|            4 |     5338 | 2026-03-23 | EC BANGA                 | W   | 0.083      | -            | -                | -                | 1 (0.083) |     0.28 | KEi, Kunai, Kylar, mwlky, mynio   |
|            3 |     5346 | 2026-03-23 | KUUSAMO.gg               | W   | 0.083      | -            | -                | -                | 1 (0.083) |     0.88 | KEi, Kunai, Kylar, mwlky, mynio   |
|            2 |     5349 | 2026-03-23 | Wampirki                 | L   | 0.083      | -            | -                | -                | -         |    -2.12 | KEi, Kunai, Kylar, mwlky, mynio   |
|            1 |     5926 | 2026-03-11 | CYBERSHOKE Esports       | L   | 0.002      | -            | -                | -                | -         |    -0.02 | KEi, Kunai, Kylar, mwlky, mynio   |

<br />
<span id="table2"></span><br />
To calculate a roster's Bounty Offered:<br />

- First, take the sum of their top 10 scaled winnings ($916.98)
- Divide that value by the 5th highest value among all rosters ($509,350.58)
- The final value (0.00) is scaled by the curve function.[<sup>3</sup>](#curveFunction)

Top ten winnings for this roster:<br />

| Event Date | Age Weight | Prize Winnings | Scaled Winnings |
| :- | -: | :- | :- |
| 2026-05-03 |      0.357 | $1,250.00      | $446.47         |
| 2026-04-16 |      0.241 | $1,000.00      | $241.34         |
| 2026-03-24 |      0.092 | $2,500.00      | $229.17         |


<span id="curveFunction"></span>_The Curve Function: 1 / ( 1 + abs( log10( x ) ) )_<br />

---
_Event data for Regional Standings provided by Liquipedia.net_<br />
