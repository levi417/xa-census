import json

with open('census_data.json') as f:
    data = json.load(f)

compact = []
for r in data:
    def n(k):
        v = r.get(k)
        if v is None or v == '': return None
        return v

    ret = n('Small Group Leader Retention')
    if ret and isinstance(ret, (int,float)) and ret <= 1: ret = round(ret * 100, 1)

    row = {
        'campus': n('Campus Name'),
        'leader': ((n('Primary Leader Name (First)') or '') + ' ' + (n('Primary Leader Name (Last)') or '')).strip() or None,
        'region': n('Region'),
        'district': n('District'),
        'calendar': n('What calendar system is your campus?'),
        'classification': n('What is your campus classification?'),
        'enrollment': n('What is the total student enrollment of your campus?'),
        'weekly_avg': n('Overall average of students attending your weekly meeting'),
        'fall_lg': n('What was the average large group attendance in the fall?'),
        'spring_lg': n('What was the average large group attendance in spring?'),
        'fall_retreat': n('How many students attended fall retreat?'),
        'salt_retreat': n('How many students attended SALT/winter retreat?'),
        'sg_students': n('What is the total number of students attending small groups'),
        'intl_students_weekly': n('How many international students included in the total above?'),
        'intl_sg': n('How many international students are included in the total above?'),
        'intl_total': n('Total number of international students involved in either small group, large group or both'),
        'pct_ag': n('What percentage of your students come from an Assemblies of God background?'),
        'pct_black': n('What percentage of your regularly involved students are Black/African American?'),
        'pct_asian': n('What percentage of your regularly involved students are Asian?'),
        'pct_hispanic': n('What percentage of your regularly involved students are Hispanic/Latino?'),
        'pct_white': n('What percentage of your regularly involved students are White/Caucasian?'),
        'conversions': n('How many students were converted or recommitted their lives to Jesus?'),
        'water_baptisms': n('How many students were baptized in water?'),
        'hs_baptisms': n('How many students were baptized in the Holy Spirit?'),
        'healings': n('How many students were physically healed?'),
        'sg_groups': n('How many separate discipleship groups meet weekly?'),
        'sg_leaders_start': n('How many students were small group leaders at the start of the school year?'),
        'sg_leaders_end': n('Of those student small group leaders, how many were small group leaders at the end of the school year year?'),
        'sg_retention_pct': ret,
        'intl_sg_leaders': n('Of those student small group leaders, how many were international students?'),
        'sg_trained': n('How many students were put through training this school year to become small group leaders?'),
        'sg_approved': n('Of these newly trained students in the previous question, how many were approved to become new small group leaders?'),
        'sg_replication': n('Small Group Leader Replication'),
        'sg_leaders_next': n('How many student small group leaders will you start with next school year?*'),
        'sg_members_per_leader': n('Small group Memebers per small group leader'),
        'staff_total': n('How many affiliated staff members, do you have on your staff team?'),
        'staff_ft': n('How many of these staff team members serve full-time in ministry?'),
        'staff_pt': n('How many of these staff team members serve part-time in ministry?'),
        'staff_volunteer': n('How many of these staff team members serve as volunteers?'),
        'years_director': n('How many years has the director been leading this Chi Alpha group?'),
        'has_cmit': n('Did you have an official CMIT program this last school year?'),
        'cmit_interns': n('How many CMIT interns are part of the program?'),
        'agwm_preparing': n('How many of your CMIT interns and/or affiliated staff are preparing for an AGWM assignment?'),
        'us_trips': n('What is the total number of U.S. missions trips?'),
        'us_trip_students': n('How many students went on U.S. mission trips?'),
        'world_trips': n('What is the total number of world mission trips?'),
        'world_trip_students': n('How many students went on world mission trip?'),
        'world_destinations': n("What were the destination(s) of world mission trips?"),
        'missionaries_at_lg': n('How many times did a world missionary preach at your large group meeting last year or engage with students in other ways (small groups, Q&A, zoom calls, etc)?'),
        'annual_missions_week': n('Does your ministry conduct an annual missions week or month?'),
    }
    row = {k: v for k, v in row.items() if v is not None}
    compact.append(row)

out = json.dumps(compact, separators=(',', ':'))
print(f'Compact size: {len(out)} chars, ~{len(out)//4} tokens')

with open('src/census_compact.json', 'w') as f:
    f.write(out)
print('Done')
