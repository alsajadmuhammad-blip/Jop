-- Run once in the Supabase SQL Editor on projects where
-- job-deadline-policy.sql has already been applied.
-- Allow detaching a legacy approved request with a missing deadline, without
-- relaxing the deadline requirement for pending requests or linked approvals.
alter table public.job_requests
  drop constraint if exists job_requests_deadline_required_check;
alter table public.job_requests
  add constraint job_requests_deadline_required_check
  check (
    status not in ('pending', 'approved')
    or deadline is not null
    or (status = 'approved' and approved_job_id is null)
  ) not valid;

drop trigger if exists job_requests_enforce_deadline on public.job_requests;
drop trigger if exists job_requests_enforce_deadline_insert on public.job_requests;
drop trigger if exists job_requests_enforce_deadline_update on public.job_requests;
create trigger job_requests_enforce_deadline_insert
before insert on public.job_requests
for each row execute function public.enforce_job_request_deadline();
create trigger job_requests_enforce_deadline_update
before update of status, deadline on public.job_requests
for each row execute function public.enforce_job_request_deadline();