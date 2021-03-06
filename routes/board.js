const express = require('express');
const router = express.Router();
const datetime = require('date-time');
const path = require('path');
const { pool, sqlErr } = require(path.join(__dirname, '../modules/mysql-connect'));
const { upload } = require(path.join(__dirname, '../modules/multer-conn'));

/*
/pug/update/4 <- 요청처리시
----router.js----
const pugRouter = reqire("./router/pug");
router.use("/pug", pugRouter);
*/

router.get(["/", "/:page"], async (req, res) => {
	let page = req.params.page ? req.params.page : "list";
	console.log('x');
	let vals = {};
	switch(page) {
		case "list":
			vals.title = "게시글 리스트 입니다.";
			let sql = "SELECT * FROM board ORDER BY id DESC";
			const connect = await pool.getConnection();
			const result = await connect.query(sql);
			connect.release();
			for(let v of result[0]) {
				if(v.realfile) v.fileIcon = true;
			}
			const resultData = result[0].map((v)=>{
				v.wdate = datetime({date: v.wdate});
				return v
			})
			vals.lists = resultData;
			res.render("list.pug", vals);
			break;
		case "write":
			vals.title = "게시글 작성 입니다.";
			res.render("write.pug", vals);
			break;
		default:
			res.redirect("/pug");
			break;
	}
});

router.get("/view/:id", async (req, res) => {
	let vals = {
		title: "게시글 상세 보기",
	}
	// console.log(req.ip);
	let id = req.params.id;
	const connect = await pool.getConnection();
	let sql = "UPDATE board SET rnum = rnum + 1 WHERE id="+id;
	let result = await connect.query(sql);
	sql = "SELECT * FROM board WHERE id="+id;
	result = await connect.query(sql);
	connect.release();
	vals.data = result[0][0];
	if(vals.data.realfile) {
		let file = vals.data.realfile.split("-");
		let filepath = "/uploads/"+file[0]+"/"+vals.data.realfile;
		vals.data.filepath = filepath;
		let img = ['.jpg', '.jpeg', '.png', '.gif'];
		let ext = path.extname(vals.data.realfile).toLowerCase();
		if(img.indexOf(ext) > -1) vals.data.fileChk = "img";
		else vals.data.fileChk = "file";
	}
	else vals.data.fileChk = "";
	//res.json(vals);
	res.render("view.pug", vals);
});

router.get("/delete/:id", async (req, res) => {
	let id = req.params.id;
	let sql = "DELETE FROM board WHERE id="+id;
	const connect = await pool.getConnection();
	const result = await connect.query(sql);
	connect.release();
	if(result[0].affectedRows == 1) {
		res.redirect("/pug");
	}
	else {
		res.send("삭제에 실패하였습니다.");
	}
});

router.get("/update/:id", async (req, res) => {
	const vals = {
		title: "게시글 수정",
	}
	const id = req.params.id;
	const sql = "SELECT * FROM board WHERE id="+id;
	const connect = await pool.getConnection();
	const result = await connect.query(sql);
	connect.release();
	vals.data = result[0][0];
	res.render("update.pug", vals);
});

router.post("/update", async (req, res) => {
	const sqlVals = [];
	sqlVals.push(req.body.title);
	sqlVals.push(req.body.content);
	sqlVals.push(req.body.id);
	const sql = "UPDATE board SET title=?, content=? WHERE id=?";
	const connect = await pool.getConnection();
	const result = await connect.query(sql, sqlVals);
	connect.release();
	if(result[0].changedRows == 1) {
		res.redirect("/pug");
	}
	else {
		res.send("수정에 실패하였습니다.");
	}
});

router.post("/create", upload.single("upfile"), async (req, res) => {
	console.log(req.fileUploadChk);
	let oriFile = ''; 
	let realFile = '';
	if(req.file) {
		oriFile = req.file.originalname;
		realFile = req.file.filename;
	}
	let sql = "INSERT INTO board SET title=?, writer=?, wdate=?, content=?, orifile=?, realfile=?";
	let val = [req.body.title, req.body.writer, new Date(), req.body.content, oriFile, realFile];
	const connect = await pool.getConnection();
	const result = await connect.query(sql, val);
	connect.release();
	res.redirect("/pug");
});

router.get("/download/:id", async (req, res) => {
	let id = req.params.id;
	let sql = "SELECT realfile, orifile FROM board WHERE id="+id;
	const connect = await pool.getConnection();
	const result = await connect.query(sql);
	let filepath = path.join(__dirname, "../uploads/"+result[0][0].realfile.split("-")[0]);
	let file = filepath + "/" + result[0][0].realfile;
	res.download(file, result[0][0].orifile);
});

module.exports = router;