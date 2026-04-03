
DROP POLICY "gm_insert" ON public.group_members;
CREATE POLICY "gm_insert" ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.group_members gm2 WHERE gm2.group_id = group_members.group_id AND gm2.user_id = auth.uid() AND gm2.role = 'admin')
    OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_members.group_id AND g.created_by = auth.uid())
  );
