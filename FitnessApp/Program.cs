using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;

namespace FitnessApp
{
    internal static class Program
    {
        [DllImport("kernel32.dll")]
        private static extern IntPtr GetConsoleWindow();

        [DllImport("user32.dll")]
        private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        private const int SW_HIDE = 0;

        [STAThread]
        private static void Main()
        {
            IntPtr console = GetConsoleWindow();
            if (console != IntPtr.Zero) ShowWindow(console, SW_HIDE);
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }

    internal class MainForm : Form
    {
        private static readonly Color SidebarColor = Color.FromArgb(24, 32, 43);
        private static readonly Color Accent = Color.FromArgb(34, 197, 94);
        private static readonly Color AccentDark = Color.FromArgb(22, 163, 74);
        private static readonly Color CardBg = Color.White;
        private static readonly Color PageBg = Color.FromArgb(244, 245, 247);
        private static readonly Color TextMain = Color.FromArgb(31, 41, 55);
        private static readonly Color TextSub = Color.FromArgb(107, 114, 128);
        private static readonly Font TitleFont = new Font("Segoe UI", 12f, FontStyle.Bold);
        private static readonly Font BigFont = new Font("Segoe UI", 20f, FontStyle.Bold);
        private static readonly Font MidFont = new Font("Segoe UI", 11f, FontStyle.Bold);
        private static readonly Font BaseFont = new Font("Segoe UI", 9.5f);

        private readonly List<Panel> pages = new List<Panel>();
        private readonly List<Button> menuButtons = new List<Button>();

        private TextBox profWeight;
        private TextBox profHeight;
        private TextBox profAge;
        private ComboBox profActivity;
        private ComboBox profGoal;
        private TextBox profRate;
        private RadioButton maleBtn;
        private RadioButton femaleBtn;
        private Label profStatus;

        private Label dashBmr;
        private Label dashTdee;
        private Label dashTarget;
        private Label dashBmiVal;
        private Label dashBmiCat;
        private Label dashHealthyW;
        private Label dashWater;
        private Panel barProteinTrack;
        private Panel barProteinFill;
        private Label barProteinText;
        private Panel barCarbTrack;
        private Panel barCarbFill;
        private Label barCarbText;
        private Panel barFatTrack;
        private Panel barFatFill;
        private Label barFatText;

        private Label planTarget;
        private Label planDiff;
        private Label planWarning;
        private Label planProteinG;
        private Label planCarbG;
        private Label planFatG;
        private Panel planPBar;
        private Panel planPBarFill;
        private Panel planCBar;
        private Panel planCBarFill;
        private Panel planFBar;
        private Panel planFBarFill;

        private Label measBmiVal;
        private Label measBmiCat;
        private Label measHealthy;
        private TextBox bfWaist;
        private TextBox bfNeck;
        private TextBox bfHip;
        private Label bfResult;
        private Label bfDeur;
        private Label idealDevine;
        private Label idealHamwi;

        private Label mealTarget;
        private Label mealUsed;
        private DataGridView mealGrid;
        private Panel mBarProteinFill;
        private Panel mBarCarbFill;
        private Panel mBarFatFill;
        private TextBox mealName;
        private TextBox mealCal;
        private TextBox mealProt;
        private TextBox mealCarb;
        private TextBox mealFat;

        private TextBox wBox;
        private ListBox wList;
        private Panel chartPanel;

        private bool isMale = true;
        private double weightKg = 70;
        private double heightCm = 175;
        private int ageYears = 25;
        private int activityLevel = 3;
        private string currentGoal = "maintain";
        private double goalRate = 0.5;

        private double curBmr;
        private double curTdee;
        private double curTarget;
        private double curProtein;
        private double curCarbs;
        private double curFat;
        private double curBmi;

        private readonly List<Meal> meals = new List<Meal>();
        private readonly List<DateTime> weightDates = new List<DateTime>();
        private readonly List<double> weightValues = new List<double>();

        private static string DataDir
        {
            get { return AppDomain.CurrentDomain.BaseDirectory; }
        }

        private static string ProfilePath { get { return Path.Combine(DataDir, "profile.txt"); } }
        private static string MealsPath { get { return Path.Combine(DataDir, "meals.txt"); } }
        private static string WeightPath { get { return Path.Combine(DataDir, "weight.txt"); } }

        public MainForm()
        {
            BuildUi();
            LoadProfile();
            LoadMeals();
            LoadWeight();
            ApplyProfileToControls();
            UpdateAll();
            ShowPage(0);
        }

        private void BuildUi()
        {
            Text = "حاسبة السعرات والتغذية للرياضي";
            ClientSize = new Size(1040, 700);
            MinimumSize = new Size(980, 640);
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = PageBg;
            Font = BaseFont;

            Panel sidebar = new Panel();
            sidebar.BackColor = SidebarColor;
            sidebar.Dock = DockStyle.Left;
            sidebar.Width = 220;
            Controls.Add(sidebar);

            Label appTitle = new Label();
            appTitle.Text = "صحتك ولياقتك";
            appTitle.ForeColor = Color.White;
            appTitle.Font = new Font("Segoe UI", 17f, FontStyle.Bold);
            appTitle.Location = new Point(20, 22);
            appTitle.Size = new Size(180, 30);
            sidebar.Controls.Add(appTitle);

            Label appSub = new Label();
            appSub.Text = "حاسبة السعرات للممارس الرياضي";
            appSub.ForeColor = Color.FromArgb(148, 163, 184);
            appSub.Font = new Font("Segoe UI", 9f);
            appSub.Location = new Point(20, 55);
            appSub.Size = new Size(190, 20);
            sidebar.Controls.Add(appSub);

            Panel sep = new Panel();
            sep.BackColor = Color.FromArgb(51, 65, 85);
            sep.Location = new Point(12, 92);
            sep.Size = new Size(196, 1);
            sidebar.Controls.Add(sep);

            string[] menuNames = { "الرئيسية", "بياناتي", "خطتي", "قياساتي", "وجباتي", "وزني" };
            for (int i = 0; i < menuNames.Length; i++)
            {
                Button b = new Button();
                b.Text = menuNames[i];
                b.FlatStyle = FlatStyle.Flat;
                b.FlatAppearance.BorderSize = 0;
                b.TextAlign = ContentAlignment.MiddleLeft;
                b.Font = new Font("Segoe UI", 11f);
                b.ForeColor = Color.FromArgb(203, 213, 225);
                b.BackColor = Color.Transparent;
                b.Location = new Point(10, 108 + i * 52);
                b.Size = new Size(200, 42);
                b.Cursor = Cursors.Hand;
                b.Tag = i;
                int index = i;
                b.Click += (s, e2) => { ShowPage(index); };
                b.Paint += MenuButton_Paint;
                sidebar.Controls.Add(b);
                menuButtons.Add(b);
            }

            Label footer = new Label();
            footer.Text = "اصدار 1.0";
            footer.ForeColor = Color.FromArgb(100, 116, 139);
            footer.Font = new Font("Segoe UI", 8.5f);
            footer.Location = new Point(20, sidebar.Height - 45);
            footer.Size = new Size(180, 20);
            sidebar.Controls.Add(footer);

            BuildDashboardPage();
            BuildProfilePage();
            BuildPlanPage();
            BuildMeasurePage();
            BuildMealsPage();
            BuildWeightPage();
        }

        private void MenuButton_Paint(object sender, PaintEventArgs e)
        {
            Button b = (Button)sender;
            int index = (int)b.Tag;
            bool active = pages.Count > 0 && pages[index].Visible;
            if (active)
            {
                using (SolidBrush brush = new SolidBrush(AccentDark))
                {
                    GraphicsPath path = RoundedRect(new Rectangle(0, 0, b.Width, b.Height), 10);
                    e.Graphics.FillPath(brush, path);
                }
                b.ForeColor = Color.White;
            }
            else
            {
                b.ForeColor = Color.FromArgb(203, 213, 225);
            }
        }

        private GraphicsPath RoundedRect(Rectangle r, int radius)
        {
            GraphicsPath path = new GraphicsPath();
            path.AddArc(r.X, r.Y, radius, radius, 180, 90);
            path.AddArc(r.Right - radius, r.Y, radius, radius, 270, 90);
            path.AddArc(r.Right - radius, r.Bottom - radius, radius, radius, 0, 90);
            path.AddArc(r.X, r.Bottom - radius, radius, radius, 90, 90);
            path.CloseFigure();
            return path;
        }

        private void ShowPage(int index)
        {
            for (int i = 0; i < pages.Count; i++)
                pages[i].Visible = i == index;
            foreach (Button b in menuButtons)
                b.Invalidate();
        }

        private Panel MakePage()
        {
            Panel p = new Panel();
            p.BackColor = PageBg;
            p.Location = new Point(220, 0);
            p.Size = new Size(830, 700);
            p.Visible = false;
            Controls.Add(p);
            pages.Add(p);
            return p;
        }

        private Panel MakeCard(Control parent, int x, int y, int w, int h, string title)
        {
            Panel card = new Panel();
            card.BackColor = CardBg;
            card.Location = new Point(x, y);
            card.Size = new Size(w, h);
            parent.Controls.Add(card);
            if (!string.IsNullOrEmpty(title))
            {
                Label t = new Label();
                t.Text = title;
                t.ForeColor = TextMain;
                t.Font = TitleFont;
                t.Location = new Point(18, 14);
                t.Size = new Size(w - 36, 26);
                t.Font = new Font("Segoe UI", 13f, FontStyle.Bold);
                card.Controls.Add(t);
            }
            return card;
        }

        private Label MakeFieldLabel(Control parent, string text, int x, int y, int w)
        {
            Label l = new Label();
            l.Text = text;
            l.ForeColor = TextSub;
            l.Location = new Point(x, y + 4);
            l.Size = new Size(w, 20);
            l.TextAlign = ContentAlignment.MiddleLeft;
            parent.Controls.Add(l);
            return l;
        }

        private TextBox MakeTextBox(Control parent, int x, int y, int w)
        {
            TextBox t = new TextBox();
            t.Location = new Point(x, y);
            t.Size = new Size(w, 26);
            t.BorderStyle = BorderStyle.FixedSingle;
            parent.Controls.Add(t);
            return t;
        }

        private void BuildDashboardPage()
        {
            Panel page = MakePage();
            MakeCard(page, 20, 20, 250, 130, "معدل الأيض الأساسي");
            dashBmr = ValueLabel(page, "…", 20, 48);
            MakeCard(page, 285, 20, 250, 130, "السعرات المحروقة يومياً");
            dashTdee = ValueLabel(page, "…", 285, 48);
            MakeCard(page, 550, 20, 250, 130, "سعراتك المستهدفة");
            dashTarget = ValueLabel(page, "…", 550, 48);

            MakeCard(page, 20, 165, 250, 130, "مؤشر كتلة الجسم");
            dashBmiVal = ValueLabel(page, "…", 20, 48);
            dashBmiCat = SubLabel(page, "…", 20, 96);

            MakeCard(page, 285, 165, 250, 130, "الوزن الصحي لك");
            dashHealthyW = ValueLabel(page, "…", 285, 48);

            MakeCard(page, 550, 165, 250, 130, "الماء اليومي");
            dashWater = ValueLabel(page, "…", 550, 48);

            Panel macroCard = MakeCard(page, 20, 315, 780, 220, "المغذيات الكبرى يومياً");
            BuildBar(macroCard, 18, 58, "البروتين", Accent, out barProteinTrack, out barProteinFill, out barProteinText);
            BuildBar(macroCard, 18, 130, "الكربوهيدرات", Color.FromArgb(59, 130, 246), out barCarbTrack, out barCarbFill, out barCarbText);
            BuildBar(macroCard, 18, 202, "الدهون", Color.FromArgb(245, 158, 11), out barFatTrack, out barFatFill, out barFatText);
        }

        private Label ValueLabel(Control parent, string text, int x, int y)
        {
            Label l = new Label();
            l.Text = text;
            l.ForeColor = AccentDark;
            l.Font = BigFont;
            l.Location = new Point(x + 18, y);
            l.Size = new Size(210, 46);
            l.TextAlign = ContentAlignment.MiddleLeft;
            parent.Controls.Add(l);
            return l;
        }

        private Label SubLabel(Control parent, string text, int x, int y)
        {
            Label l = new Label();
            l.Text = text;
            l.ForeColor = TextSub;
            l.Location = new Point(x + 18, y);
            l.Size = new Size(220, 24);
            l.TextAlign = ContentAlignment.MiddleLeft;
            parent.Controls.Add(l);
            return l;
        }

        private void BuildBar(Control card, int x, int y, string name, Color color, out Panel track, out Panel fill, out Label text)
        {
            Label nameLabel = new Label();
            nameLabel.Text = name;
            nameLabel.ForeColor = TextMain;
            nameLabel.Font = MidFont;
            nameLabel.Location = new Point(x, y);
            nameLabel.Size = new Size(120, 22);
            card.Controls.Add(nameLabel);

            track = new Panel();
            track.BackColor = Color.FromArgb(229, 231, 235);
            track.Location = new Point(x + 130, y + 2);
            track.Size = new Size(480, 18);
            card.Controls.Add(track);

            fill = new Panel();
            fill.BackColor = color;
            fill.Location = track.Location;
            fill.Size = new Size(0, 18);
            fill.Tag = track.Width;
            card.Controls.Add(fill);

            text = new Label();
            text.ForeColor = TextSub;
            text.Location = new Point(x + 620, y);
            text.Size = new Size(150, 22);
            text.TextAlign = ContentAlignment.MiddleLeft;
            card.Controls.Add(text);
        }

        private void BuildProfilePage()
        {
            Panel page = MakePage();
            Panel card = MakeCard(page, 80, 40, 670, 500, "البيانات الشخصية");

            MakeFieldLabel(card, "الجنس", 60, 70, 120);
            maleBtn = new RadioButton();
            maleBtn.Text = "ذكر";
            maleBtn.Location = new Point(210, 68);
            maleBtn.Checked = true;
            femaleBtn = new RadioButton();
            femaleBtn.Text = "أنثى";
            femaleBtn.Location = new Point(290, 68);
            card.Controls.Add(maleBtn);
            card.Controls.Add(femaleBtn);
            maleBtn.CheckedChanged += (s, e) => { isMale = maleBtn.Checked; UpdateAll(); SaveProfile(); };
            femaleBtn.CheckedChanged += (s, e) => { isMale = maleBtn.Checked; UpdateAll(); SaveProfile(); };

            MakeFieldLabel(card, "الوزن (كغ)", 60, 120, 120);
            profWeight = MakeTextBox(card, 210, 116, 120);
            profWeight.TextChanged += (s, e) => { ParseProfile(); UpdateAll(); };

            MakeFieldLabel(card, "الطول (سم)", 380, 120, 120);
            profHeight = MakeTextBox(card, 510, 116, 120);
            profHeight.TextChanged += (s, e) => { ParseProfile(); UpdateAll(); };

            MakeFieldLabel(card, "العمر (سنة)", 60, 170, 120);
            profAge = MakeTextBox(card, 210, 166, 120);
            profAge.TextChanged += (s, e) => { ParseProfile(); UpdateAll(); };

            MakeFieldLabel(card, "مستوى النشاط", 380, 170, 160);
            profActivity = new ComboBox();
            profActivity.DropDownStyle = ComboBoxStyle.DropDownList;
            profActivity.Items.Add("خامل (مكتبي بلا رياضة)");
            profActivity.Items.Add("نشاط خفيف (رياضة 1-3 مرات أسبوعياً)");
            profActivity.Items.Add("نشاط متوسط (رياضة 3-5 مرات أسبوعياً)");
            profActivity.Items.Add("نشاط مرتفع (رياضة مكثفة 6-7 مرات)");
            profActivity.Items.Add("نشاط مرتفع جداً (مكثف + عمل شاق)");
            profActivity.SelectedIndex = 2;
            profActivity.Location = new Point(510, 166);
            profActivity.Size = new Size(120, 26);
            profActivity.SelectedIndexChanged += (s, e) => { UpdateAll(); }; 
            card.Controls.Add(profActivity);

            MakeFieldLabel(card, "الهدف", 60, 220, 120);
            profGoal = new ComboBox();
            profGoal.DropDownStyle = ComboBoxStyle.DropDownList;
            profGoal.Items.Add("خسارة الدهون");
            profGoal.Items.Add("الحفاظ على الوزن");
            profGoal.Items.Add("زيادة الكتلة العضلية");
            profGoal.SelectedIndex = 0;
            profGoal.Location = new Point(210, 216);
            profGoal.Size = new Size(180, 26);
            profGoal.SelectedIndexChanged += (s, e) => { UpdateAll(); };
            card.Controls.Add(profGoal);

            MakeFieldLabel(card, "السرعة المرغوبة (كغ/أسبوع)", 60, 270, 180);
            profRate = MakeTextBox(card, 210, 266, 120);
            profRate.Text = "0.5";

            Button saveBtn = MakeAccentButton("حفظ البيانات", new Point(210, 330), new Size(150, 40));
            saveBtn.Click += (s, e) => { SaveProfile(); profStatus.Text = "تم حفظ بياناتك بنجاح."; };
            card.Controls.Add(saveBtn);

            profStatus = new Label();
            profStatus.Text = "التغييرات تُحسب لحظياً.";
            profStatus.ForeColor = AccentDark;
            profStatus.Location = new Point(210, 390);
            profStatus.Size = new Size(300, 24);
            card.Controls.Add(profStatus);
        }

        private Button MakeAccentButton(string text, Point loc, Size size)
        {
            Button b = new Button();
            b.Text = text;
            b.Location = loc;
            b.Size = size;
            b.FlatStyle = FlatStyle.Flat;
            b.FlatAppearance.BorderSize = 0;
            b.BackColor = Accent;
            b.ForeColor = Color.White;
            b.Font = new Font("Segoe UI", 10.5f, FontStyle.Bold);
            b.Cursor = Cursors.Hand;
            return b;
        }

        private void ApplyProfileToControls()
        {
            maleBtn.Checked = isMale;
            femaleBtn.Checked = !isMale;
            profWeight.Text = weightKg.ToString(CultureInfo.InvariantCulture);
            profHeight.Text = heightCm.ToString(CultureInfo.InvariantCulture);
            profAge.Text = ageYears.ToString(CultureInfo.InvariantCulture);
            profActivity.SelectedIndex = activityLevel - 1;
            profGoal.SelectedIndex = currentGoal == "lose" ? 0 : (currentGoal == "gain" ? 2 : 1);
            profRate.Text = goalRate.ToString(CultureInfo.InvariantCulture);
        }

        private void ParseProfile()
        {
            double w = ParseDouble(profWeight.Text);
            double h = ParseDouble(profHeight.Text);
            int a;
            int.TryParse(profAge.Text, out a);
            w = w > 0 ? w : 0;
            h = h > 0 ? h : 0;
            a = a > 0 ? a : 0;
            weightKg = w > 0 ? w : weightKg;
            heightCm = h > 0 ? h : heightCm;
            ageYears = a > 0 ? a : ageYears;
            double r = ParseDouble(profRate.Text);
            if (r > 0) goalRate = r;
        }

        private double ParseDouble(string s)
        {
            double d;
            if (s == null) return 0;
            string t = s.Trim().Replace(',', '.');
            return double.TryParse(t, NumberStyles.Float, CultureInfo.InvariantCulture, out d) ? d : 0;
        }

        private void BuildPlanPage()
        {
            Panel page = MakePage();
            Panel card = MakeCard(page, 40, 30, 750, 300, "خطتك الغذائية");
            MakeFieldLabel(card, "السعرات اليومية المحروقة (TDEE)", 40, 65, 280);
            planTarget = ValueLabelSmall(card, "…", 40, 95);
            MakeFieldLabel(card, "سعراتك المستهدفة اليوم", 340, 65, 220);
            planDiff = ValueLabelSmall(card, "…", 340, 95);
            planWarning = new Label();
            planWarning.ForeColor = Color.FromArgb(220, 38, 38);
            planWarning.Location = new Point(40, 150);
            planWarning.Size = new Size(680, 40);
            card.Controls.Add(planWarning);

            Panel macroCard = MakeCard(page, 40, 350, 750, 260, "توزيع المغذيات الكبرى");
            BuildBarPlan(macroCard, 18, 66, "البروتين", Accent, out planPBar, out planPBarFill, out planProteinG);
            BuildBarPlan(macroCard, 18, 138, "الكربوهيدرات", Color.FromArgb(59, 130, 246), out planCBar, out planCBarFill, out planCarbG);
            BuildBarPlan(macroCard, 18, 210, "الدهون", Color.FromArgb(245, 158, 11), out planFBar, out planFBarFill, out planFatG);
        }

        private Label ValueLabelSmall(Control parent, string text, int x, int y)
        {
            Label l = new Label();
            l.Text = text;
            l.ForeColor = AccentDark;
            l.Font = new Font("Segoe UI", 16f, FontStyle.Bold);
            l.Location = new Point(x, y);
            l.Size = new Size(260, 40);
            parent.Controls.Add(l);
            return l;
        }

        private void BuildBarPlan(Control card, int x, int y, string name, Color color, out Panel track, out Panel fill, out Label text)
        {
            Label nameLabel = new Label();
            nameLabel.Text = name;
            nameLabel.ForeColor = TextMain;
            nameLabel.Font = MidFont;
            nameLabel.Location = new Point(x, y);
            nameLabel.Size = new Size(120, 22);
            card.Controls.Add(nameLabel);

            track = new Panel();
            track.BackColor = Color.FromArgb(229, 231, 235);
            track.Location = new Point(x + 130, y + 2);
            track.Size = new Size(420, 20);
            card.Controls.Add(track);

            fill = new Panel();
            fill.BackColor = color;
            fill.Location = track.Location;
            fill.Size = new Size(0, 20);
            fill.Tag = track.Width;
            card.Controls.Add(fill);

            text = new Label();
            text.ForeColor = TextSub;
            text.Location = new Point(x + 560, y);
            text.Size = new Size(180, 24);
            text.TextAlign = ContentAlignment.MiddleLeft;
            card.Controls.Add(text);
        }

        private void BuildMeasurePage()
        {
            Panel page = MakePage();

            Panel bmiCard = MakeCard(page, 40, 30, 370, 300, "مؤشر كتلة الجسم (BMI)");
            MakeFieldLabel(bmiCard, "ناتج القياس", 30, 70, 150);
            measBmiVal = ValueLabelSmall(bmiCard, "…", 30, 100);
            measBmiCat = SubLabel2(bmiCard, "…", 30, 150);
            measHealthy = new Label();
            measHealthy.ForeColor = TextSub;
            measHealthy.Location = new Point(30, 185);
            measHealthy.Size = new Size(320, 60);
            bmiCard.Controls.Add(measHealthy);

            Panel idealCard = MakeCard(page, 430, 30, 370, 300, "الوزن المثالي");
            MakeFieldLabel(idealCard, "معادلة ديفين", 30, 70, 150);
            idealDevine = ValueLabelSmall(idealCard, "…", 30, 100);
            MakeFieldLabel(idealCard, "معادلة هاموي", 30, 160, 150);
            idealHamwi = ValueLabelSmall(idealCard, "…", 30, 190);

            Panel bfCard = MakeCard(page, 40, 350, 760, 300, "نسبة دهون الجسم (طريقة القوات البحرية)");
            MakeFieldLabel(bfCard, "محيط الخصر (سم)", 30, 70, 150);
            bfWaist = MakeTextBox(bfCard, 190, 66, 100);
            MakeFieldLabel(bfCard, "محيط الرقبة (سم)", 310, 70, 150);
            bfNeck = MakeTextBox(bfCard, 470, 66, 100);
            MakeFieldLabel(bfCard, "محيط الأرداف (سم) - للنساء فقط", 30, 116, 240);
            bfHip = MakeTextBox(bfCard, 280, 112, 100);

            Button calcBtn = MakeAccentButton("حساب نسبة الدهون", new Point(470, 110), new Size(190, 40));
            calcBtn.Click += (s, e) => CalcBodyFat();
            bfCard.Controls.Add(calcBtn);

            bfResult = SubLabel2(bfCard, "…", 30, 180);
            bfDeur = SubLabel2(bfCard, "…", 30, 220);
        }

        private Label SubLabel2(Control parent, string text, int x, int y)
        {
            Label l = new Label();
            l.Text = text;
            l.ForeColor = TextMain;
            l.Location = new Point(x, y);
            l.Size = new Size(340, 28);
            l.TextAlign = ContentAlignment.MiddleLeft;
            parent.Controls.Add(l);
            return l;
        }

        private void CalcBodyFat()
        {
            double waist = ParseDouble(bfWaist.Text);
            double neck = ParseDouble(bfNeck.Text);
            double hip = isMale ? 0 : ParseDouble(bfHip.Text);
            if (waist <= 0 || neck <= 0 || (!isMale && hip <= 0))
            {
                bfResult.Text = "أدخل القياسات المطلوبة كاملة.";
                bfDeur.Text = "";
                return;
            }
            double navy;
            if (isMale)
            {
                navy = 495.0 / (1.0324 - 0.19077 * Math.Log10(waist - neck) + 0.15456 * Math.Log10(heightCm)) - 450.0;
            }
            else
            {
                navy = 495.0 / (1.29579 - 0.35004 * Math.Log10(waist + hip - neck) + 0.22100 * Math.Log10(heightCm)) - 450.0;
            }
            if (navy < 0) navy = 0;
            double deur = 1.2 * curBmi + 0.23 * ageYears - 10.8 * (isMale ? 1 : 0) - 5.4;
            if (deur < 0) deur = 0;
            bfResult.Text = "الدهون (نافال): " + Math.Round(navy, 1) + " % — " + FatCategory(navy);
            bfDeur.Text = "الدهون (ديورنبرغ): " + Math.Round(deur, 1) + " % — " + FatCategory(deur);
        }

        private string FatCategory(double bf)
        {
            if (isMale)
            {
                if (bf < 6) return "دهون أساسية";
                if (bf < 14) return "رياضي";
                if (bf < 18) return "لياقة";
                if (bf < 25) return "متوسطة";
                return "سمنة";
            }
            if (bf < 14) return "دهون أساسية";
            if (bf < 21) return "رياضي";
            if (bf < 25) return "لياقة";
            if (bf < 32) return "متوسطة";
            return "سمنة";
        }

        private void BuildMealsPage()
        {
            Panel page = MakePage();
            Panel summaryCard = MakeCard(page, 20, 20, 790, 105, "جرد اليوم");
            MakeFieldLabel(summaryCard, "هدفك اليومي", 30, 55, 120);
            mealTarget = ValueLabelSmall(summaryCard, "…", 30, 72);
            MakeFieldLabel(summaryCard, "المستهلك", 240, 55, 120);
            mealUsed = ValueLabelOrange(summaryCard, "…", 240, 72);

            Panel gridCard = MakeCard(page, 20, 140, 790, 330, "وجبات اليوم");
            mealGrid = new DataGridView();
            mealGrid.AllowUserToAddRows = false;
            mealGrid.AllowUserToDeleteRows = false;
            mealGrid.ReadOnly = true;
            mealGrid.RowHeadersVisible = false;
            mealGrid.BackgroundColor = Color.White;
            mealGrid.BorderStyle = BorderStyle.None;
            mealGrid.Location = new Point(16, 50);
            mealGrid.Size = new Size(758, 180);
            mealGrid.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            mealGrid.ColumnHeadersDefaultCellStyle.Font = new Font("Segoe UI", 10f, FontStyle.Bold);
            mealGrid.ColumnHeadersDefaultCellStyle.BackColor = Color.FromArgb(229, 231, 235);
            mealGrid.ColumnHeadersDefaultCellStyle.ForeColor = TextMain;
            mealGrid.Columns.Add("name", "الوجبة");
            mealGrid.Columns.Add("cal", "سعرات");
            mealGrid.Columns.Add("pr", "بروتين (غ)");
            mealGrid.Columns.Add("ca", "كربو (غ)");
            mealGrid.Columns.Add("fa", "دهون (غ)");
            foreach (DataGridViewColumn c in mealGrid.Columns)
                c.SortMode = DataGridViewColumnSortMode.NotSortable;
            gridCard.Controls.Add(mealGrid);

            Button delBtn = MakeAccentButton("حذف المحدد", new Point(640, 248), new Size(130, 34));
            delBtn.BackColor = Color.FromArgb(220, 38, 38);
            delBtn.Click += (s, e) => DeleteMeal();
            gridCard.Controls.Add(delBtn);

            Button clearBtn = MakeAccentButton("مسح الكل", new Point(500, 248), new Size(120, 34));
            clearBtn.BackColor = Color.FromArgb(107, 114, 128);
            clearBtn.Click += (s, e) => { meals.Clear(); SaveMeals(); UpdateMealUi(); };
            gridCard.Controls.Add(clearBtn);

            BuildMiniBar(gridCard, 30, 292, "بروتين", out mBarProteinFill, Accent);
            BuildMiniBar(gridCard, 294, 292, "كربو", out mBarCarbFill, Color.FromArgb(59, 130, 246));
            BuildMiniBar(gridCard, 558, 292, "دهون", out mBarFatFill, Color.FromArgb(245, 158, 11));

            Panel addCard = MakeCard(page, 20, 485, 790, 195, "إضافة وجبة");
            MakeFieldLabel(addCard, "اسم الوجبة", 30, 54, 100);
            mealName = MakeTextBox(addCard, 140, 50, 150);
            MakeFieldLabel(addCard, "سعرات", 310, 54, 60);
            mealCal = MakeTextBox(addCard, 370, 50, 70);
            MakeFieldLabel(addCard, "بروتين", 460, 54, 70);
            mealProt = MakeTextBox(addCard, 530, 50, 60);
            MakeFieldLabel(addCard, "كربو", 600, 54, 60);
            mealCarb = MakeTextBox(addCard, 640, 50, 60);
            MakeFieldLabel(addCard, "دهون", 460, 104, 70);
            mealFat = MakeTextBox(addCard, 530, 100, 60);

            Button addBtn = MakeAccentButton("إضافة", new Point(640, 100), new Size(110, 34));
            addBtn.Click += (s, e) => AddMeal();
            addCard.Controls.Add(addBtn);
        }

        private Label ValueLabelOrange(Control parent, string text, int x, int y)
        {
            Label l = new Label();
            l.Text = text;
            l.ForeColor = Color.FromArgb(245, 158, 11);
            l.Font = new Font("Segoe UI", 15f, FontStyle.Bold);
            l.Location = new Point(x, y);
            l.Size = new Size(120, 36);
            parent.Controls.Add(l);
            return l;
        }

        private void BuildMiniBar(Control card, int x, int y, string name, out Panel fill, Color color)
        {
            Label n = new Label();
            n.Text = name;
            n.ForeColor = TextSub;
            n.Location = new Point(x, y);
            n.Size = new Size(60, 20);
            card.Controls.Add(n);
            Panel track = new Panel();
            track.BackColor = Color.FromArgb(229, 231, 235);
            track.Location = new Point(x + 65, y);
            track.Size = new Size(160, 16);
            card.Controls.Add(track);
            fill = new Panel();
            fill.BackColor = color;
            fill.Location = track.Location;
            fill.Size = new Size(0, 16);
            fill.Tag = track.Width;
            card.Controls.Add(fill);
        }

        private void AddMeal()
        {
            string name = mealName.Text.Trim();
            if (name == "") name = "وجبة";
            double cal = ParseDouble(mealCal.Text);
            double pr = ParseDouble(mealProt.Text);
            double ca = ParseDouble(mealCarb.Text);
            double fa = ParseDouble(mealFat.Text);
            meals.Add(new Meal(name, cal, pr, ca, fa));
            SaveMeals();
            mealName.Text = "";
            mealCal.Text = "";
            mealProt.Text = "";
            mealCarb.Text = "";
            mealFat.Text = "";
            UpdateMealUi();
        }

        private void DeleteMeal()
        {
            if (mealGrid.SelectedRows.Count > 0)
            {
                int idx = mealGrid.SelectedRows[0].Index;
                if (idx >= 0 && idx < meals.Count)
                {
                    meals.RemoveAt(idx);
                    SaveMeals();
                    UpdateMealUi();
                }
            }
        }

        private void UpdateMealUi()
        {
            mealGrid.Rows.Clear();
            double total = 0, tp = 0, tc = 0, tf = 0;
            foreach (Meal m in meals)
            {
                total += m.Calories;
                tp += m.Protein;
                tc += m.Carbs;
                tf += m.Fat;
                mealGrid.Rows.Add(m.Name, Math.Round(m.Calories, 0).ToString(CultureInfo.InvariantCulture),
                    Math.Round(m.Protein, 1).ToString(CultureInfo.InvariantCulture),
                    Math.Round(m.Carbs, 1).ToString(CultureInfo.InvariantCulture),
                    Math.Round(m.Fat, 1).ToString(CultureInfo.InvariantCulture));
            }
            mealTarget.Text = Math.Round(curTarget, 0).ToString(CultureInfo.InvariantCulture) + " سعرة";
            mealUsed.Text = Math.Round(total, 0).ToString(CultureInfo.InvariantCulture) + " سعرة";
            SetBarFill(mBarProteinFill, tp, Math.Max(1, curProtein));
            SetBarFill(mBarCarbFill, tc, Math.Max(1, curCarbs));
            SetBarFill(mBarFatFill, tf, Math.Max(1, curFat));
        }

        private void BuildWeightPage()
        {
            Panel page = MakePage();
            Panel addCard = MakeCard(page, 30, 30, 380, 300, "تسجيل الوزن");
            MakeFieldLabel(addCard, "الوزن اليوم (كغ)", 30, 70, 150);
            wBox = MakeTextBox(addCard, 30, 100, 150);
            Button addBtn = MakeAccentButton("تسجيل", new Point(200, 98), new Size(120, 34));
            addBtn.Click += (s, e) => AddWeight();
            addCard.Controls.Add(addBtn);
            wList = new ListBox();
            wList.Location = new Point(30, 160);
            wList.Size = new Size(320, 110);
            wList.BorderStyle = BorderStyle.FixedSingle;
            addCard.Controls.Add(wList);
            Button delBtn = MakeAccentButton("حذف المحدد", new Point(30, 245), new Size(120, 32));
            delBtn.BackColor = Color.FromArgb(220, 38, 38);
            delBtn.Click += (s, e) => DeleteWeight();
            addCard.Controls.Add(delBtn);

            Panel chartCard = MakeCard(page, 430, 30, 380, 300, "منحنى الوزن");
            chartPanel = new Panel();
            chartPanel.BackColor = Color.White;
            chartPanel.Location = new Point(20, 60);
            chartPanel.Size = new Size(340, 220);
            chartPanel.Paint += chartPanel_Paint;
            chartCard.Controls.Add(chartPanel);
        }

        private void AddWeight()
        {
            double w = ParseDouble(wBox.Text);
            if (w <= 0) { wBox.Text = ""; return; }
            weightDates.Add(DateTime.Today);
            weightValues.Add(w);
            SaveWeight();
            UpdateWeightList();
            chartPanel.Invalidate();
            wBox.Text = "";
        }

        private void DeleteWeight()
        {
            if (wList.SelectedIndex >= 0 && wList.SelectedIndex < weightValues.Count)
            {
                weightDates.RemoveAt(wList.SelectedIndex);
                weightValues.RemoveAt(wList.SelectedIndex);
                SaveWeight();
                UpdateWeightList();
                chartPanel.Invalidate();
            }
        }

        private void UpdateWeightList()
        {
            wList.Items.Clear();
            for (int i = 0; i < weightValues.Count; i++)
            {
                wList.Items.Add(weightDates[i].ToString("yyyy-MM-dd") + "  :  " + Math.Round(weightValues[i], 1).ToString(CultureInfo.InvariantCulture) + " كغ");
            }
        }

        private void chartPanel_Paint(object sender, PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            Rectangle area = new Rectangle(10, 10, chartPanel.Width - 20, chartPanel.Height - 20);
            g.FillRectangle(Brushes.White, area);
            using (Pen border = new Pen(Color.FromArgb(229, 231, 235)))
                g.DrawRectangle(border, area);
            if (weightValues.Count < 2)
            {
                using (SolidBrush b = new SolidBrush(TextSub))
                {
                    string msg = weightValues.Count == 0 ? "سجّل وزنك ليظهر المنحنى" : "أضف قيمة أخرى لإظهار المنحنى";
                    StringFormat sf = new StringFormat();
                    sf.Alignment = StringAlignment.Center;
                    sf.LineAlignment = StringAlignment.Center;
                    g.DrawString(msg, BaseFont, b, area, sf);
                }
                return;
            }
            double minV = double.MaxValue, maxV = double.MinValue;
            foreach (double v in weightValues) { if (v < minV) minV = v; if (v > maxV) maxV = v; }
            if (maxV - minV < 1) { maxV = minV + 1; minV = minV - 1; }
            double span = maxV - minV;
            int n = weightValues.Count;
            Point[] pts = new Point[n];
            int usableW = area.Width - 8;
            int usableH = area.Height - 8;
            for (int i = 0; i < n; i++)
            {
                int x = area.Left + 4 + (int)((usableW - 4) * (double)i / (n - 1));
                int y = area.Top + 4 + (int)((usableH - 8) * (1 - (weightValues[i] - minV) / span));
                pts[i] = new Point(x, y);
            }
            using (Pen line = new Pen(Accent, 2.5f))
                g.DrawLines(line, pts);
            using (SolidBrush dot = new SolidBrush(AccentDark))
            {
                foreach (Point p in pts)
                    g.FillEllipse(dot, p.X - 3, p.Y - 3, 6, 6);
            }
            using (SolidBrush b = new SolidBrush(TextSub))
            {
                g.DrawString("الأعلى: " + Math.Round(maxV, 1).ToString(CultureInfo.InvariantCulture), BaseFont, b, area.Left + 6, area.Top + 2);
                g.DrawString("الأدنى: " + Math.Round(minV, 1).ToString(CultureInfo.InvariantCulture), BaseFont, b, area.Right - 70, area.Bottom - 18);
            }
        }

        private void UpdateAll()
        {
            activityLevel = profActivity.SelectedIndex + 1;
            currentGoal = profGoal.SelectedIndex == 0 ? "lose" : (profGoal.SelectedIndex == 2 ? "gain" : "maintain");
            isMale = maleBtn.Checked;
            double w = ParseDouble(profWeight.Text);
            double h = ParseDouble(profHeight.Text);
            int a;
            int.TryParse(profAge.Text, out a);
            double r = ParseDouble(profRate.Text);
            if (w > 0) weightKg = w;
            if (h > 0) heightCm = h;
            if (a > 0) ageYears = a;
            if (r > 0) goalRate = r;

            double bmr = ComputeBMR();
            double tdee = bmr * ActivityFactor();
            curBmr = bmr;
            curTdee = tdee;
            double adjust = goalRate * 7700.0 / 7.0;
            curTarget = currentGoal == "lose" ? tdee - adjust : (currentGoal == "gain" ? tdee + adjust : tdee);
            if (curTarget < 0) curTarget = 0;

            double proteinPerKg = currentGoal == "lose" ? 2.2 : (currentGoal == "gain" ? 2.0 : 1.8);
            curProtein = proteinPerKg * weightKg;
            double fatCal = curTarget * 0.25;
            curFat = fatCal / 9.0;
            double carbCal = curTarget - (curProtein * 4.0) - fatCal;
            curCarbs = carbCal > 0 ? carbCal / 4.0 : 0;

            double heightM = heightCm / 100.0;
            curBmi = weightKg > 0 && heightM > 0 ? weightKg / (heightM * heightM) : 0;

            dashBmr.Text = Math.Round(bmr, 0).ToString(CultureInfo.InvariantCulture) + " سعرة";
            dashTdee.Text = Math.Round(tdee, 0).ToString(CultureInfo.InvariantCulture) + " سعرة";
            dashTarget.Text = Math.Round(curTarget, 0).ToString(CultureInfo.InvariantCulture) + " سعرة";
            dashBmiVal.Text = Math.Round(curBmi, 1).ToString(CultureInfo.InvariantCulture);
            dashBmiCat.Text = BMICategory(curBmi);
            dashHealthyW.Text = Math.Round(18.5 * heightM * heightM, 1).ToString(CultureInfo.InvariantCulture) + " - " +
                                Math.Round(24.9 * heightM * heightM, 1).ToString(CultureInfo.InvariantCulture) + " كغ";
            dashWater.Text = Math.Round((weightKg * 35.0 + (activityLevel - 1) * 300.0) / 1000.0, 2).ToString(CultureInfo.InvariantCulture) + " لتر";

            SetBarFill(barProteinFill, curProtein * 4.0, curTarget);
            barProteinText.Text = Math.Round(curProtein, 1).ToString(CultureInfo.InvariantCulture) + "غ / " +
                                  Math.Round(curProtein * 4, 0).ToString(CultureInfo.InvariantCulture) + " سعرة";
            SetBarFill(barCarbFill, curCarbs * 4.0, curTarget);
            barCarbText.Text = Math.Round(curCarbs, 1).ToString(CultureInfo.InvariantCulture) + "غ / " +
                               Math.Round(curCarbs * 4, 0).ToString(CultureInfo.InvariantCulture) + " سعرة";
            SetBarFill(barFatFill, curFat * 9.0, curTarget);
            barFatText.Text = Math.Round(curFat, 1).ToString(CultureInfo.InvariantCulture) + "غ / " +
                              Math.Round(curFat * 9, 0).ToString(CultureInfo.InvariantCulture) + " سعرة";

            planTarget.Text = Math.Round(tdee, 0).ToString(CultureInfo.InvariantCulture) + " سعرة (TDEE)";
            planDiff.Text = Math.Round(curTarget, 0).ToString(CultureInfo.InvariantCulture) + " سعرة (الفرق " +
                            Math.Round(curTarget - tdee, 0).ToString(CultureInfo.InvariantCulture) + ")";
            planWarning.Text = curTarget < bmr
                ? "تنبيه: سعراتك المستهدفة أدنى من معدل الأيض الأساسي، وهذا قد يُفقدك عضلاً. خفّف السرعة."
                : "";
            planProteinG.Text = "البروتين: " + Math.Round(curProtein, 1).ToString(CultureInfo.InvariantCulture) + "غ  (" +
                                Math.Round(curProtein * 4 / (curTarget > 0 ? curTarget : 1) * 100, 0).ToString(CultureInfo.InvariantCulture) + "%)";
            planCarbG.Text = "الكربوهيدرات: " + Math.Round(curCarbs, 1).ToString(CultureInfo.InvariantCulture) + "غ  (" +
                             Math.Round(curCarbs * 4 / (curTarget > 0 ? curTarget : 1) * 100, 0).ToString(CultureInfo.InvariantCulture) + "%)";
            planFatG.Text = "الدهون: " + Math.Round(curFat, 1).ToString(CultureInfo.InvariantCulture) + "غ  (" +
                            Math.Round(curFat * 9 / (curTarget > 0 ? curTarget : 1) * 100, 0).ToString(CultureInfo.InvariantCulture) + "%)";

            SetBarFill(planPBarFill, curProtein, Math.Max(1, curProtein));
            SetBarFill(planCBarFill, curCarbs, Math.Max(1, curCarbs));
            SetBarFill(planFBarFill, curFat, Math.Max(1, curFat));

            measBmiVal.Text = Math.Round(curBmi, 1).ToString(CultureInfo.InvariantCulture);
            measBmiCat.Text = "التصنيف: " + BMICategory(curBmi);
            measHealthy.Text = "الوزن الصحي لطولك: " + Math.Round(18.5 * heightM * heightM, 1).ToString(CultureInfo.InvariantCulture) +
                               " - " + Math.Round(24.9 * heightM * heightM, 1).ToString(CultureInfo.InvariantCulture) + " كغ\n" +
                               "BMI لا يميّز العضل عن الدهون؛ الرياضيون قد يُصنّفون أعلى صحياً.";
            double inches = heightCm / 2.54;
            idealDevine.Text = (isMale ? 50.0 + 2.3 * (inches - 60) : 45.5 + 2.3 * (inches - 60)).ToString("F1", CultureInfo.InvariantCulture) + " كغ";
            idealHamwi.Text = (isMale ? 48.0 + 2.7 * (inches - 60) : 45.5 + 2.7 * (inches - 60)).ToString("F1", CultureInfo.InvariantCulture) + " كغ";

            UpdateMealUi();
        }

        private void SetBarFill(Panel fill, double value, double total)
        {
            int trackWidth = 300;
            object tag = fill.Tag;
            if (tag is int) trackWidth = (int)tag;
            double ratio = total > 0 ? value / total : 0;
            if (ratio < 0) ratio = 0;
            if (ratio > 1) ratio = 1;
            fill.Width = (int)(trackWidth * ratio);
        }

        private double ComputeBMR()
        {
            if (isMale)
                return 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * ageYears);
            return 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * ageYears);
        }

        private double ActivityFactor()
        {
            switch (activityLevel)
            {
                case 1: return 1.2;
                case 2: return 1.375;
                case 3: return 1.55;
                case 4: return 1.725;
                default: return 1.9;
            }
        }

        private string BMICategory(double bmi)
        {
            if (bmi < 16) return "نحافة شديدة";
            if (bmi < 18.5) return "نحافة";
            if (bmi < 25) return "وزن طبيعي";
            if (bmi < 30) return "زيادة وزن";
            if (bmi < 35) return "سمنة درجة أولى";
            if (bmi < 40) return "سمنة درجة ثانية";
            return "سمنة مفرطة";
        }

        private void SaveProfile()
        {
            try
            {
                using (StreamWriter sw = new StreamWriter(ProfilePath, false, Encoding.UTF8))
                {
                    sw.WriteLine(isMale ? "male" : "female");
                    sw.WriteLine(weightKg.ToString(CultureInfo.InvariantCulture));
                    sw.WriteLine(heightCm.ToString(CultureInfo.InvariantCulture));
                    sw.WriteLine(ageYears.ToString(CultureInfo.InvariantCulture));
                    sw.WriteLine(activityLevel.ToString(CultureInfo.InvariantCulture));
                    sw.WriteLine(currentGoal);
                    sw.WriteLine(goalRate.ToString(CultureInfo.InvariantCulture));
                }
            }
            catch { }
        }

        private void LoadProfile()
        {
            try
            {
                if (!File.Exists(ProfilePath)) return;
                string[] lines = File.ReadAllLines(ProfilePath, Encoding.UTF8);
                if (lines.Length < 7) return;
                isMale = lines[0].Trim() == "male";
                double.TryParse(lines[1], NumberStyles.Float, CultureInfo.InvariantCulture, out weightKg);
                double.TryParse(lines[2], NumberStyles.Float, CultureInfo.InvariantCulture, out heightCm);
                int.TryParse(lines[3], out ageYears);
                int.TryParse(lines[4], out activityLevel);
                currentGoal = lines[5].Trim();
                double.TryParse(lines[6], NumberStyles.Float, CultureInfo.InvariantCulture, out goalRate);
                if (activityLevel < 1 || activityLevel > 5) activityLevel = 3;
                if (currentGoal != "lose" && currentGoal != "gain") currentGoal = "maintain";
            }
            catch { }
        }

        private void LoadMeals()
        {
            try
            {
                meals.Clear();
                if (!File.Exists(MealsPath)) return;
                string[] lines = File.ReadAllLines(MealsPath, Encoding.UTF8);
                foreach (string line in lines)
                {
                    string[] parts = line.Split('|');
                    if (parts.Length < 5) continue;
                    double cal, pr, ca, fa;
                    if (double.TryParse(parts[1], out cal) &&
                        double.TryParse(parts[2], out pr) &&
                        double.TryParse(parts[3], out ca) &&
                        double.TryParse(parts[4], out fa))
                    {
                        meals.Add(new Meal(parts[0], cal, pr, ca, fa));
                    }
                }
            }
            catch { }
        }

        private void SaveMeals()
        {
            try
            {
                using (StreamWriter sw = new StreamWriter(MealsPath, false, Encoding.UTF8))
                {
                    foreach (Meal m in meals)
                    {
                        sw.WriteLine(m.Name + "|" + m.Calories.ToString(CultureInfo.InvariantCulture) + "|" +
                            m.Protein.ToString(CultureInfo.InvariantCulture) + "|" +
                            m.Carbs.ToString(CultureInfo.InvariantCulture) + "|" +
                            m.Fat.ToString(CultureInfo.InvariantCulture));
                    }
                }
            }
            catch { }
        }

        private void LoadWeight()
        {
            try
            {
                weightDates.Clear();
                weightValues.Clear();
                if (!File.Exists(WeightPath)) return;
                string[] lines = File.ReadAllLines(WeightPath, Encoding.UTF8);
                foreach (string line in lines)
                {
                    string[] parts = line.Split('|');
                    if (parts.Length < 2) continue;
                    DateTime dt;
                    double v;
                    if (DateTime.TryParseExact(parts[0], "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out dt) &&
                        double.TryParse(parts[1], NumberStyles.Float, CultureInfo.InvariantCulture, out v))
                    {
                        weightDates.Add(dt);
                        weightValues.Add(v);
                    }
                }
            }
            catch { }
            UpdateWeightList();
        }

        private void SaveWeight()
        {
            try
            {
                using (StreamWriter sw = new StreamWriter(WeightPath, false, Encoding.UTF8))
                {
                    for (int i = 0; i < weightValues.Count; i++)
                    {
                        sw.WriteLine(weightDates[i].ToString("yyyy-MM-dd") + "|" + weightValues[i].ToString(CultureInfo.InvariantCulture));
                    }
                }
            }
            catch { }
        }
    }

    internal class Meal
    {
        public Meal(string name, double calories, double protein, double carbs, double fat)
        {
            Name = name;
            Calories = calories;
            Protein = protein;
            Carbs = carbs;
            Fat = fat;
        }

        public string Name { get; set; }
        public double Calories { get; set; }
        public double Protein { get; set; }
        public double Carbs { get; set; }
        public double Fat { get; set; }
    }
}