
var maps = {
	test: {
		blocks: {
			"#": { wall: "stone-01" },
			".": { floor: "stone-02" },
			",": { floor: "stone-03" },
			"*": { floor: "stone-02" }
		},
		map: [
			"####################",
			"#..*...............#",
			"#....#...........*.#",
			"#....#........######",
			"#....#*............#",
			"#..................#",
			"#...##.#######*....#",
			"#..................#",
			"#............#,,,,,#",
			"#..........*.#,,,,,#",
			"####################"
		],
		start: [ 5, 8 ],
		gridSize: 100
	}
};
