using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text;

namespace CalorieApp
{
    internal class Program
    {
        private static bool isMale = true;
        private static double weightKg = 70.0;
        private static double heightCm = 175.0;
        private static int ageYears = 25;
        private static int activityLevel = 3;
        private static string currentGoal = "maintain";
        private static double goalRate = 0.5;
        private static readonly List<Meal> meals = new List<Meal>();

        private const int KcalPerKgFat = 7700;

        private static string ProfilePath
        {
            get { return Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "profile.txt"); }
        }

        private static string MealsPath
        {
            get { return Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "meals.txt"); }
        }

        private static void Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;
            Console.InputEncoding = Encoding.UTF8;
            LoadProfile();
            LoadMeals();

            bool running = true;
            while (running)
            {
                ShowMenu();
                string choice = Console.ReadLine();
                if (choice != null) choice = choice.Trim();
                switch (choice)
                {
                    case "1": EditProfile(); break;
                    case "2": ShowBMR(); break;
                    case "3": ShowTDEE(); break;
                    case "4": ShowGoalPlan(); break;
                    case "5": ShowBMI(); break;
                    case "6": ShowBodyFat(); break;
                    case "7": ShowIdealWeight(); break;
                    case "8": ShowWater(); break;
                    case "9": MealTracker(); break;
                    case "10": ShowFullReport(); break;
                    case "0": running = false; break;
                    default:
                        Console.WriteLine("اختيار غير صحيح، حاول مجدداً.");
                        break;
                }

                if (running && choice != "9")
                {
                    Console.WriteLine();
                    Console.WriteLine("اضغط أي مفتاح للعودة إلى القائمة...");
                    try { Console.ReadKey(true); }
                    catch (InvalidOperationException) { }
                }
            }

            SaveProfile();
            SaveMeals();
            Console.WriteLine("تم حفظ بياناتك. مع السلامة!");
        }

        private static void SafeClear()
        {
            try { Console.Clear(); }
            catch (IOException) { }
        }

        private static void ShowMenu()
        {
            SafeClear();
            Console.WriteLine("==============================================");
            Console.WriteLine("      حاسبة السعرات والتغذية للرياضي");
            Console.WriteLine("==============================================");
            Console.WriteLine("  1) إدخال / تعديل البيانات الشخصية");
            Console.WriteLine("  2) معدل الأيض الأساسي BMR");
            Console.WriteLine("  3) السعرات اليومية المحروقة TDEE");
            Console.WriteLine("  4) خطة السعرات والمغذيات حسب الهدف");
            Console.WriteLine("  5) مؤشر كتلة الجسم BMI");
            Console.WriteLine("  6) نسبة دهون الجسم");
            Console.WriteLine("  7) الوزن المثالي");
            Console.WriteLine("  8) كمية الماء اليومية");
            Console.WriteLine("  9) تتبع الوجبات اليومية");
            Console.WriteLine(" 10) تقرير شامل كامل");
            Console.WriteLine("  0) خروج");
            Console.WriteLine("----------------------------------------------");
            Console.Write("اختر رقماً: ");
        }

        private static void EditProfile()
        {
            Console.WriteLine("=== إدخال / تعديل البيانات الشخصية ===");
            Console.WriteLine("    الوزن بالكيلوغرام والطول بالسنتيمتر");
            Console.WriteLine();

            while (true)
            {
                Console.Write("الجنس ( ذكر / أنثى ): ");
                string g = Console.ReadLine();
                if (g == null) g = "";
                while (g.Trim() == "")
                {
                    Console.Write("الجنس ( ذكر / أنثى ): ");
                    g = Console.ReadLine();
                    if (g == null) g = "";
                }
                g = g.Trim();
                if (g == "ذكر" || g == "ذ" || g.ToLowerInvariant() == "m" || g.ToLowerInvariant() == "male")
                {
                    isMale = true;
                    break;
                }
                if (g == "أنثى" || g == "ر" || g.ToLowerInvariant() == "f" || g.ToLowerInvariant() == "female")
                {
                    isMale = false;
                    break;
                }
                Console.WriteLine("أدخل: ذكر أو أنثى");
            }

            weightKg = ReadPositiveDouble("الوزن (كغ): ");
            heightCm = ReadPositiveDouble("الطول (سم): ");
            ageYears = ReadPositiveInt("العمر (سنة): ");

            Console.WriteLine("مستوى النشاط اليومي:");
            Console.WriteLine("  1) خامل - عمل مكتبي بدون رياضة");
            Console.WriteLine("  2) نشاط خفيف - رياضة 1-3 مرات في الأسبوع");
            Console.WriteLine("  3) نشاط متوسط - رياضة 3-5 مرات في الأسبوع");
            Console.WriteLine("  4) نشاط مرتفع - رياضة مكثفة 6-7 مرات");
            Console.WriteLine("  5) نشاط مرتفع جداً - رياضة مكثفة + عمل شاق");
            while (true)
            {
                int a = ReadPositiveInt("مستوى النشاط (1-5): ");
                if (a >= 1 && a <= 5)
                {
                    activityLevel = a;
                    break;
                }
                Console.WriteLine("أدخل رقماً بين 1 و 5");
            }

            Console.WriteLine("الهدف:");
            Console.WriteLine("  1) خسارة الدهون");
            Console.WriteLine("  2) الحفاظ على الوزن");
            Console.WriteLine("  3) زيادة الكتلة العضلية");
            while (true)
            {
                int g = ReadPositiveInt("الهدف (1-3): ");
                if (g == 1) { currentGoal = "lose"; break; }
                if (g == 2) { currentGoal = "maintain"; break; }
                if (g == 3) { currentGoal = "gain"; break; }
                Console.WriteLine("أدخل رقماً بين 1 و 3");
            }

            if (currentGoal != "maintain")
            {
                goalRate = ReadPositiveDouble("السرعة المطلوبة أسبوعياً بالكيلوغرام (مثال: 0.5): ");
            }

            Console.WriteLine("تم حفظ بياناتك الجديدة بنجاح.");
            SaveProfile();
        }

        private static double ReadPositiveDouble(string prompt)
        {
            while (true)
            {
                Console.Write(prompt);
                string input = Console.ReadLine();
                if (input != null) input = input.Trim().Replace(',', '.');
                double value;
                if (double.TryParse(input, NumberStyles.Float, CultureInfo.InvariantCulture, out value) && value > 0)
                    return value;
                Console.WriteLine("قيمة غير صحيحة، أدخل رقماً موجباً.");
            }
        }

        private static int ReadPositiveInt(string prompt)
        {
            while (true)
            {
                Console.Write(prompt);
                string input = Console.ReadLine();
                int value;
                if (int.TryParse(input, out value) && value > 0)
                    return value;
                Console.WriteLine("قيمة غير صحيحة، أدخل رقماً صحيحاً موجباً.");
            }
        }

        private static double ComputeBMRHarris()
        {
            if (isMale)
                return 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * ageYears);
            return 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * ageYears);
        }

        private static double ComputeBMRMifflin()
        {
            if (isMale)
                return (10 * weightKg) + (6.25 * heightCm) - (5 * ageYears) + 5;
            return (10 * weightKg) + (6.25 * heightCm) - (5 * ageYears) - 161;
        }

        private static double ActivityFactor()
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

        private static double ComputeTDEE()
        {
            return ComputeBMRHarris() * ActivityFactor();
        }

        private static double ComputeTDEEm()
        {
            return ComputeBMRMifflin() * ActivityFactor();
        }

        private static void ShowBMR()
        {
            Console.WriteLine("=== معدل الأيض الأساسي (BMR) ===");
            Console.WriteLine("هو عدد السعرات التي يحرقها جسمك في الراحة التامة.");
            Console.WriteLine();
            Console.WriteLine("معادلة هاريس-بنديكت: " + Math.Round(ComputeBMRHarris(), 0) + " سعرة/يوم");
            Console.WriteLine("معادلة ميفلن-سانت جيور (الأدق): " + Math.Round(ComputeBMRMifflin(), 0) + " سعرة/يوم");
        }

        private static void ShowTDEE()
        {
            Console.WriteLine("=== السعرات اليومية المحروقة (TDEE) ===");
            Console.WriteLine("هو مجموع السعرات التي تحرقها يومياً بما في ذلك نشاطك الرياضي.");
            Console.WriteLine();
            Console.WriteLine("مستوى النشاط: " + ActivityName(activityLevel));
            Console.WriteLine("TDEE حسب هاريس-بنديكت: " + Math.Round(ComputeTDEE(), 0) + " سعرة/يوم");
            Console.WriteLine("TDEE حسب ميفلن-سانت جيور: " + Math.Round(ComputeTDEEm(), 0) + " سعرة/يوم");
        }

        private static string ActivityName(int level)
        {
            switch (level)
            {
                case 1: return "خامل";
                case 2: return "نشاط خفيف";
                case 3: return "نشاط متوسط";
                case 4: return "نشاط مرتفع";
                default: return "نشاط مرتفع جداً";
            }
        }

        private static double ComputeTargetCalories()
        {
            double tdee = ComputeTDEE();
            double adjust = goalRate * KcalPerKgFat / 7.0;
            if (currentGoal == "lose") return tdee - adjust;
            if (currentGoal == "gain") return tdee + adjust;
            return tdee;
        }

        private static void ShowGoalPlan()
        {
            double target = ComputeTargetCalories();
            double tdee = ComputeTDEE();
            Console.WriteLine("=== خطة السعرات والمغذيات حسب الهدف ===");
            Console.WriteLine();
            Console.WriteLine("الهدف: " + GoalName(currentGoal));
            Console.WriteLine("TDEE: " + Math.Round(tdee, 0) + " سعرة/يوم");
            Console.WriteLine("سعراتك اليومية المستهدفة: " + Math.Round(target, 0) + " سعرة/يوم");
            Console.WriteLine("الفرق اليومي: " + Math.Round(target - tdee, 0) + " سعرة");
            Console.WriteLine();

            if (target < ComputeBMRHarris())
            {
                Console.WriteLine("تنبيه: سعراتك المستهدفة أقل من معدل الأيض الأساسي،");
                Console.WriteLine("هذا قد يضر بعضلاتك وأيضك. قلل سرعة الخسارة أو زد النشاط.");
                Console.WriteLine();
            }

            double proteinPerKg = currentGoal == "lose" ? 2.2 : (currentGoal == "gain" ? 2.0 : 1.8);
            double proteinG = proteinPerKg * weightKg;
            double fatCal = target * 0.25;
            double fatG = fatCal / 9.0;
            double carbCal = target - (proteinG * 4.0) - fatCal;
            double carbG = Math.Max(0, carbCal / 4.0);

            Console.WriteLine("المغذيات الكبرى الموصى بها:");
            Console.WriteLine("  بروتين  : " + Math.Round(proteinG, 1) + " غرام (" + Math.Round(proteinG * 4.0, 0) + " سعرة)");
            Console.WriteLine("  دهون    : " + Math.Round(fatG, 1) + " غرام (" + Math.Round(fatCal, 0) + " سعرة)");
            Console.WriteLine("  كربوهيدرات: " + Math.Round(carbG, 1) + " غرام (" + Math.Round(carbG * 4.0, 0) + " سعرة)");
        }

        private static string GoalName(string goal)
        {
            if (goal == "lose") return "خسارة الدهون";
            if (goal == "gain") return "زيادة الكتلة العضلية";
            return "الحفاظ على الوزن";
        }

        private static double ComputeBMI()
        {
            double heightM = heightCm / 100.0;
            return weightKg / (heightM * heightM);
        }

        private static void ShowBMI()
        {
            double bmi = ComputeBMI();
            Console.WriteLine("=== مؤشر كتلة الجسم (BMI) ===");
            Console.WriteLine("مؤشر كتلة الجسم: " + Math.Round(bmi, 2));
            Console.WriteLine("التصنيف: " + BMICategory(bmi));
            Console.WriteLine();
            double heightM = heightCm / 100.0;
            double minW = 18.5 * heightM * heightM;
            double maxW = 24.9 * heightM * heightM;
            Console.WriteLine("نطاق الوزن الصحي لطولك: " + Math.Round(minW, 1) + " - " + Math.Round(maxW, 1) + " كغ");
            Console.WriteLine("علماً أن BMI لا يميّز بين العضل والدهون، الرياضيون قد يكونون أعلى صحياً.");
        }

        private static string BMICategory(double bmi)
        {
            if (bmi < 16) return "نحافة شديدة";
            if (bmi < 18.5) return "نحافة";
            if (bmi < 25) return "وزن طبيعي";
            if (bmi < 30) return "زيادة وزن";
            if (bmi < 35) return "سمنة درجة أولى";
            if (bmi < 40) return "سمنة درجة ثانية";
            return "سمنة مفرطة";
        }

        private static void ShowBodyFat()
        {
            Console.WriteLine("=== نسبة دهون الجسم ===");
            Console.WriteLine();
            Console.WriteLine("أدخل قياساتك (بالسنتيمتر) لطريقة القوات البحرية:");
            double waist = ReadPositiveDouble("محيط الخصر: ");
            double neck = ReadPositiveDouble("محيط الرقبة: ");
            double hip = 0;
            if (!isMale)
            {
                hip = ReadPositiveDouble("محيط الأرداف: ");
            }
            double bodyFatNavy = NavyFormula(waist, neck, hip);
            Console.WriteLine();
            Console.WriteLine("نسبة الدهون (طريقة القوات البحرية): " + Math.Round(bodyFatNavy, 1) + " %");

            double bodyFatDeur = 1.2 * ComputeBMI() + 0.23 * ageYears - 10.8 * (isMale ? 1 : 0) - 5.4;
            Console.WriteLine("نسبة الدهون (معادلة ديورنبرغ): " + Math.Round(bodyFatDeur, 1) + " %");
            Console.WriteLine();
            Console.WriteLine("التصنيف الرياضي:");
            ShowAthleteClassification();
            if (currentGoal == "lose")
            {
                Console.WriteLine();
                Console.WriteLine("الدهون مهمة لهرموناتك، لا تنزل بها تحت الحد الأدنى أبداً.");
            }
        }

        private static double NavyFormula(double waist, double neck, double hip)
        {
            double bf;
            if (isMale)
            {
                double logTerm = Math.Log10(waist - neck) * (-0.19077) + 0.15456 * Math.Log10(heightCm);
                bf = 495.0 / (1.0324 - 0.19077 * Math.Log10(waist - neck) + 0.15456 * Math.Log10(heightCm)) - 450.0;
            }
            else
            {
                bf = 495.0 / (1.29579 - 0.35004 * Math.Log10(waist + hip - neck) + 0.22100 * Math.Log10(heightCm)) - 450.0;
            }
            if (bf < 0) bf = 0;
            return bf;
        }

        private static void ShowAthleteClassification()
        {
            Console.WriteLine("  رجال : دهون أساسية 3-6% | رياضي 6-13% | لياقة 14-17% | متوسطة 18-24% | سمنة 25%+");
            Console.WriteLine("  نساء : دهون أساسية 10-13% | رياضي 14-20% | لياقة 21-24% | متوسطة 25-31% | سمنة 32%+");
        }

        private static void ShowIdealWeight()
        {
            Console.WriteLine("=== الوزن المثالي حسب الطول ===");
            Console.WriteLine();
            double inches = heightCm / 2.54;
            double devineM = isMale ? 50.0 + 2.3 * (inches - 60) : 45.5 + 2.3 * (inches - 60);
            double hamwiM = isMale ? 48.0 + 2.7 * (inches - 60) : 45.5 + 2.7 * (inches - 60);
            Console.WriteLine("معادلة ديفين: " + Math.Round(devineM, 1) + " كغ");
            Console.WriteLine("معادلة هاموي: " + Math.Round(hamwiM, 1) + " كغ");
            Console.WriteLine();
            double heightM = heightCm / 100.0;
            Console.WriteLine("النطاق الصحي (BMI 18.5-24.9): " + Math.Round(18.5 * heightM * heightM, 1) + " - " + Math.Round(24.9 * heightM * heightM, 1) + " كغ");
            Console.WriteLine("هذه مجرد تقديرات، العامل الوراثي والكتلة العضلية يلعبان دوراً أكبر.");
        }

        private static void ShowWater()
        {
            Console.WriteLine("=== كمية الماء اليومية ===");
            double baseMl = weightKg * 35.0;
            double exerciseBonus = (activityLevel - 1) * 300.0;
            double totalMl = baseMl + exerciseBonus;
            Console.WriteLine("الماء الأساسي (35 مل لكل كغ): " + Math.Round(baseMl / 1000.0, 2) + " لتر");
            Console.WriteLine("مكافأة النشاط الرياضي: " + Math.Round(exerciseBonus / 1000.0, 2) + " لتر");
            Console.WriteLine("الكمية اليومية الموصى بها: " + Math.Round(totalMl / 1000.0, 2) + " لتر");
            Console.WriteLine();
            Console.WriteLine("نصيحة: اشرب 500 مل إضافية لكل ساعة تدريب شاق.");
        }

        private static void MealTracker()
        {
            Console.WriteLine("=== تتبع الوجبات اليومية ===");
            double target = ComputeTargetCalories();
            double total = 0;
            double totalProtein = 0;
            double totalCarbs = 0;
            double totalFat = 0;

            while (true)
            {
                total = 0; totalProtein = 0; totalCarbs = 0; totalFat = 0;
                SafeClear();
                Console.WriteLine("=== تتبع الوجبات اليومية ===");
                Console.WriteLine("الهدف اليومي: " + Math.Round(target, 0) + " سعرة");
                Console.WriteLine("----------------------------------------------");
                if (meals.Count == 0)
                {
                    Console.WriteLine("لا توجد وجبات مسجلة حتى الآن.");
                }
                else
                {
                    for (int i = 0; i < meals.Count; i++)
                    {
                        Meal m = meals[i];
                        Console.WriteLine((i + 1) + ") " + m.Name);
                        Console.WriteLine("      سعرة: " + m.Calories + " | بروتين: " + m.Protein + "غ | كارب: " + m.Carbs + "غ | دهون: " + m.Fat + "غ");
                        total += m.Calories;
                        totalProtein += m.Protein;
                        totalCarbs += m.Carbs;
                        totalFat += m.Fat;
                    }
                }
                Console.WriteLine("----------------------------------------------");
                Console.WriteLine("المجموع: " + Math.Round(total, 0) + " من " + Math.Round(target, 0) + " سعرة");
                double remaining = target - total;
                Console.WriteLine("المتبقي: " + Math.Round(remaining, 0) + " سعرة");
                Console.WriteLine("بروتين كلّي: " + Math.Round(totalProtein, 1) + "غ | كارب: " + Math.Round(totalCarbs, 1) + "غ | دهون: " + Math.Round(totalFat, 1) + "غ");
                Console.WriteLine("----------------------------------------------");
                Console.WriteLine("  1) إضافة وجبة");
                Console.WriteLine("  2) حذف وجبة");
                Console.WriteLine("  3) مسح كل الوجبات");
                Console.WriteLine("  0) رجوع إلى القائمة");
                Console.Write("اختيار: ");
                string choice = Console.ReadLine();
                if (choice != null) choice = choice.Trim();
                if (choice == "1")
                {
                    AddMeal();
                }
                else if (choice == "2")
                {
                    int idx = ReadPositiveInt("رقم الوجبة للحذف: ");
                    if (idx >= 1 && idx <= meals.Count)
                    {
                        meals.RemoveAt(idx - 1);
                        SaveMeals();
                    }
                    else
                    {
                        Console.WriteLine("رقم غير صحيح.");
                    }
                }
                else if (choice == "3")
                {
                    meals.Clear();
                    SaveMeals();
                    Console.WriteLine("تم مسح كل الوجبات.");
                }
                else if (choice == "0")
                {
                    break;
                }
            }
        }

        private static void AddMeal()
        {
            Console.Write("اسم الوجبة: ");
            string name = Console.ReadLine();
            if (string.IsNullOrEmpty(name)) name = "وجبة";
            double cal = ReadPositiveDouble("السعرات الحرارية: ");
            double protein = ReadPositiveDouble("البروتين (غرام): ");
            double carbs = ReadPositiveDouble("الكربوهيدرات (غرام): ");
            double fat = ReadPositiveDouble("الدهون (غرام): ");
            meals.Add(new Meal(name, cal, protein, carbs, fat));
            SaveMeals();
            Console.WriteLine("تمت إضافة الوجبة.");
            try { Console.ReadKey(true); }
            catch (InvalidOperationException) { }
        }

        private static void ShowFullReport()
        {
            Console.WriteLine("=== التقرير الشامل ===");
            Console.WriteLine("الجنس: " + (isMale ? "ذكر" : "أنثى"));
            Console.WriteLine("الوزن: " + weightKg + " كغ | الطول: " + heightCm + " سم | العمر: " + ageYears + " سنة");
            Console.WriteLine("النشاط: " + ActivityName(activityLevel) + " | الهدف: " + GoalName(currentGoal));
            Console.WriteLine();
            double bmr = ComputeBMRHarris();
            double tdee = ComputeTDEE();
            double target = ComputeTargetCalories();
            Console.WriteLine("BMR: " + Math.Round(bmr, 0) + " سعرة | TDEE: " + Math.Round(tdee, 0) + " سعرة");
            Console.WriteLine("السعرات المستهدفة: " + Math.Round(target, 0) + " سعرة | الفرق: " + Math.Round(target - tdee, 0) + " سعرة");
            Console.WriteLine();
            double bmi = ComputeBMI();
            Console.WriteLine("BMI: " + Math.Round(bmi, 2) + " (" + BMICategory(bmi) + ")");
            double heightM = heightCm / 100.0;
            Console.WriteLine("الوزن الصحي: " + Math.Round(18.5 * heightM * heightM, 1) + " - " + Math.Round(24.9 * heightM * heightM, 1) + " كغ");
            Console.WriteLine("الماء اليومي: " + Math.Round((weightKg * 35.0 + (activityLevel - 1) * 300.0) / 1000.0, 2) + " لتر");
            Console.WriteLine();
            double proteinPerKg = currentGoal == "lose" ? 2.2 : (currentGoal == "gain" ? 2.0 : 1.8);
            double proteinG = proteinPerKg * weightKg;
            double fatCal = target * 0.25;
            double fatG = fatCal / 9.0;
            double carbG = Math.Max(0, (target - (proteinG * 4.0) - fatCal) / 4.0);
            Console.WriteLine("البروتين اليومي: " + Math.Round(proteinG, 1) + "غ | الدهون: " + Math.Round(fatG, 1) + "غ | الكربوهيدرات: " + Math.Round(carbG, 1) + "غ");
            Console.WriteLine();
            Console.WriteLine("نصائح سريعة:");
            Console.WriteLine("  - وزّع البروتين على 4-5 وجبات يومياً.");
            Console.WriteLine("  - ونام 7-9 ساعات لنمو العضلات والتعافي.");
            Console.WriteLine("  - خصص يوم راحة أسبوعياً على الأقل.");
            Console.WriteLine("  - ركز على الكربوهيدرات المعقدة قبل التدريب والبروتين بعده.");
        }

        private static void SaveProfile()
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
            catch (Exception ex)
            {
                Console.WriteLine("تعذر حفظ الملف الشخصي: " + ex.Message);
            }
        }

        private static void LoadProfile()
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
            catch (Exception ex)
            {
                Console.WriteLine("تعذر تحميل الملف الشخصي: " + ex.Message);
            }
        }

        private static void SaveMeals()
        {
            try
            {
                using (StreamWriter sw = new StreamWriter(MealsPath, false, Encoding.UTF8))
                {
                    foreach (Meal m in meals)
                    {
                        sw.WriteLine(m.Name + "|" + m.Calories + "|" + m.Protein + "|" + m.Carbs + "|" + m.Fat);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("تعذر حفظ الوجبات: " + ex.Message);
            }
        }

        private static void LoadMeals()
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
                    double cal, protein, carbs, fat;
                    if (double.TryParse(parts[1], out cal) &&
                        double.TryParse(parts[2], out protein) &&
                        double.TryParse(parts[3], out carbs) &&
                        double.TryParse(parts[4], out fat))
                    {
                        meals.Add(new Meal(parts[0], cal, protein, carbs, fat));
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("تعذر تحميل الوجبات: " + ex.Message);
            }
        }
    }

    internal class Meal
    {
        public Meal(string name, double cal, double protein, double carbs, double fat)
        {
            Name = name;
            Calories = cal;
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